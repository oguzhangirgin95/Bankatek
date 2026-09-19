import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { environment } from '@env/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({ trustProxyHeaders: true });

/**
 * index.html'deki yer tutucu.
 *
 * Angular SSR isaretlemeyi uretirken ngCspNonce'u ariyor ve buldugunda kritik
 * CSS yukleyicisini satir ici onload yerine nonce'lu script'e cevirip stillere
 * de nonce basiyor. Bu yuzden yer tutucu derleme ciktisinda bulunuyor, gercek
 * degeri her istekte sunucu yaziyor.
 */
const NONCE_PLACEHOLDER = 'NG_CSP_NONCE';

/** Satir ici script ve style'lara nonce eklenecek; src/href verilenlere dokunulmaz. */
const INLINE_TAG = /<(script|style)(?![^>]*\bnonce=)([^>]*)>/gi;

/** CSP'de izin verilen dis adresler; ortam dosyasindan gelir. Bos birakilan
 * adres listeye eklenmez. */
function originOf(address: string): string {
  try {
    return address ? new URL(address).origin : '';
  } catch {
    return '';
  }
}

const externalOrigins = [
  originOf(environment.keycloak.url),
  originOf(environment.weather.url),
  originOf(environment.map.tiles),
  originOf(environment.map.glyphs),
  originOf(environment.map.sprite),
  originOf(environment.geocode.url),
]
  .filter((origin) => origin !== '')
  // Karo, yazi tipi ve ikon genelde ayni sunucudan geliyor; ayni koken listede
  // birden fazla kez yer almasin.
  .filter((origin, index, list) => list.indexOf(origin) === index)
  .join(' ');

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    // MapLibre karo cozumlemesini worker'da yapiyor ve worker'i blob olarak
    // uretiyor. 'worker-src' hic verilmezse tarayici 'script-src'e dusuyor, o
    // da blob'a izin vermedigi icin harita hic acilmiyor.
    //
    // Blob'u tamamen disarida birakmanin yolu maplibre-gl'in 'csp' derlemesi
    // ve setWorkerUrl(): worker ayri bir dosyadan gelir. Bu, worker dosyasinin
    // dagitimda dogru yoldan servis edilmesine bagli oldugu icin tercih
    // edilmedi; blob worker'in actigi alan zaten script-src ile sinirli.
    "worker-src 'self' blob:",
    `style-src 'self' 'nonce-${nonce}'`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    // Angular [style.x] baglamalarini SSR'da style ozniteligi olarak basiyor;
    // nonce ozniteliklere islemiyor, deger de Angular tarafindan uretiliyor.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https://randomuser.me",
    "font-src 'self'",
    `connect-src 'self' ${externalOrigins}`.trim(),
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Isaretlemeye nonce yerlestirir.
 *
 * Angular'in olay tekrari script'leri derleme aninda, nonce'suz basiliyor;
 * bilesen stilleri de satir ici geliyor. Ikisi de burada isaretleniyor.
 * app-root'a eklenen ngCspNonce ise tarayicida sonradan yuklenen bilesenlerin
 * stillerini kapsiyor.
 */
function applyNonce(html: string, nonce: string): string {
  return html
    .replaceAll(NONCE_PLACEHOLDER, nonce)
    .replace(INLINE_TAG, (_match, tag, rest) => `<${tag}${rest} nonce="${nonce}">`);
}

/** Her istek icin taze nonce uretir ve guvenlik basliklarini yazar. */
app.use((req, res, next) => {
  const nonce = randomBytes(16).toString('base64');

  res.locals['cspNonce'] = nonce;

  res.setHeader('Content-Security-Policy', contentSecurityPolicy(nonce));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');

  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        next();
        return;
      }

      // Yalnizca HTML'e nonce isleniyor; digerleri oldugu gibi akiyor.
      if (!(response.headers.get('content-type') ?? '').includes('text/html')) {
        writeResponseToNodeResponse(response, res);
        return;
      }

      const html = applyNonce(await response.text(), res.locals['cspNonce']);

      response.headers.forEach((value, key) => {
        if (key !== 'content-length' && key !== 'content-encoding' && key !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      res.status(response.status).send(html);
    })
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
