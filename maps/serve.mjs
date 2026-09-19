/**
 * Karo sunucusu, Docker gerekmeden.
 *
 * `docker-compose.yml` içindeki nginx ile aynı işi yapar; Docker kurulu
 * olmayan bir makinede geliştirme yapabilmek için duruyor. Dağıtımda nginx
 * kullanılmalı: bu sunucu tek süreç, tek iş parçacığı ve erişim günlüğü yok.
 *
 * Bağımlılığı yok, Node'un kendi modülleriyle çalışır:
 *
 *   node maps/serve.mjs            .maps/tiles klasörünü 8088'de açar
 *   node maps/serve.mjs 9000       başka bir port
 *
 * nginx.conf ile aynı üç şeyi yapması şart, yoksa harita çalışmaz:
 *   - Range istekleri (pmtiles arşivinden yalnızca gereken baytlar okunur)
 *   - CORS ve OPTIONS yanıtı (uygulama 4200'de, karolar 8088'de)
 *   - sıkıştırma yok (sıkıştırılmış içeriğin aralığı verilemiyor)
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2] ?? 8088);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.maps', 'tiles');

/** Uzantıdan içerik türü. Bilinmeyen uzantı ikili veri sayılır. */
const TYPES = {
  '.pmtiles': 'application/octet-stream',
  '.pbf': 'application/x-protobuf',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, If-Match, If-None-Match',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, ETag, Accept-Ranges',
};

/**
 * İstek yolunu diskteki dosyaya çevirir.
 *
 * Yol kök klasörün dışına çıkıyorsa null döner: '..' ile yukarı tırmanan bir
 * istek yoksa bu sunucu makinedeki her dosyayı verirdi.
 */
function resolvePath(url) {
  const raw = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const target = normalize(join(root, raw));

  return target === root || target.startsWith(root + sep) ? target : null;
}

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    // Range güvenli listede olmadığı için tarayıcı asıl istekten önce bunu
    // gönderiyor; yanıtlanmazsa karo isteği hiç çıkmıyor.
    response.writeHead(204, { ...CORS, 'Access-Control-Max-Age': '86400' });
    response.end();

    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, CORS);
    response.end();

    return;
  }

  const path = resolvePath(request.url ?? '/');

  let size;

  try {
    const info = statSync(path ?? '');

    if (!info.isFile()) {
      throw new Error('dizin');
    }

    size = info.size;
  } catch {
    response.writeHead(404, { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('bulunamadi\n');

    return;
  }

  const headers = {
    ...CORS,
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=604800',
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');

  if (!range) {
    response.writeHead(200, { ...headers, 'Content-Length': size });

    if (request.method === 'HEAD') {
      response.end();

      return;
    }

    createReadStream(path).pipe(response);

    return;
  }

  // 'bytes=500-' sondan sonuna kadar, 'bytes=-500' son 500 bayt demek.
  const suffix = range[1] === '';
  const start = suffix ? Math.max(0, size - Number(range[2])) : Number(range[1]);
  const end = suffix || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);

  if (start > end || start >= size) {
    response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
    response.end();

    return;
  }

  response.writeHead(206, {
    ...headers,
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': end - start + 1,
  });

  if (request.method === 'HEAD') {
    response.end();

    return;
  }

  createReadStream(path, { start, end }).pipe(response);
});

server.listen(port, () => {
  console.log(`karo sunucusu  http://localhost:${port}`);
  console.log(`klasor         ${root}`);
});
