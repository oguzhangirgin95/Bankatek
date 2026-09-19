/**
 * İl sınırlarını üretir: frontend/public/geo/turkey-provinces.geojson
 *
 * Haritada bir ili boyamak için sınır poligonu gerekiyor. Vektör karodaki
 * `boundary` katmanı yalnızca çizgi taşıyor, dolgu için kapalı alan vermiyor;
 * bu yüzden sınırlar ayrı bir GeoJSON olarak duruyor.
 *
 * Kaynak github.com/cihadturhan/tr-geojson, verisi OpenStreetMap'ten üretilmiş
 * ve ODbL ile lisanslı — yani karolarla aynı lisans. Haritadaki
 * '© OpenStreetMap katkıcıları' satırı bu veriyi de kapsıyor.
 *
 * Betik iki şey ekliyor:
 *   - plaka kodu: kaynakta yalnızca il adı var, uygulama kodla eşleştiriyor
 *   - küçültme: koordinatlar dört basamağa yuvarlanıyor (~11 m). İl sınırı için
 *     fazlasıyla yeterli, dosya belirgin küçülüyor.
 *
 * Çalıştırma (internet gerekir, tek seferlik):
 *   node maps/provinces.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SINIR_URL = 'https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json';
const IL_URL = 'https://turkiyeapi.dev/api/v1/provinces?fields=id,name';

/** Koordinat basamağı. Dört basamak ~11 metre. */
const DIGITS = 4;

/**
 * Ad eşleştirmesi için sadeleştirme.
 *
 * `lib/commons/map/map.ts` içindeki `plain()` ile aynı mantık: küçük harfe
 * indirip Türkçe karakterleri ASCII karşılığına çeviriyor, böylece iki kaynak
 * aynı ili farklı yazsa da eşleşiyorlar.
 */
function plain(text) {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/i̇/g, 'i')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * İki kaynağın ayrıldığı adlar.
 *
 * Tek bir tane var ama elle düzeltmek yerine burada durması gerekiyor: kaynak
 * veri yenilendiğinde farkın nerede olduğu görünür kalsın.
 */
const ALIAS = {
  afyon: 'afyonkarahisar',
};

/** Koordinatları yuvarlar; iç içe dizilerde derinliğe bakmadan çalışır. */
function round(value) {
  if (typeof value === 'number') {
    return Number(value.toFixed(DIGITS));
  }

  return value.map(round);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'frontend', 'public', 'geo', 'turkey-provinces.geojson');

const [sinirlar, iller] = await Promise.all([
  fetch(SINIR_URL).then((response) => response.json()),
  fetch(IL_URL)
    .then((response) => response.json())
    .then((body) => body.data),
]);

const kodlar = {};
iller.forEach((il) => (kodlar[plain(il.name)] = String(il.id).padStart(2, '0')));

const eksik = [];

const features = sinirlar.features.map((feature) => {
  const ad = plain(feature.properties.name);
  const kod = kodlar[ALIAS[ad] ?? ad];

  if (!kod) {
    eksik.push(feature.properties.name);
  }

  return {
    type: 'Feature',
    // Kimlik özelliklerde değil burada: MapLibre 'feature-state' ve filtreleri
    // için kimliğin üst düzeyde olması gerekiyor.
    id: Number(kod),
    properties: { code: kod, name: feature.properties.name },
    geometry: { type: feature.geometry.type, coordinates: round(feature.geometry.coordinates) },
  };
});

if (eksik.length) {
  throw new Error(`Plaka kodu bulunamayan il: ${eksik.join(', ')}`);
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ type: 'FeatureCollection', features }), 'utf8');

const boyut = (await import('node:fs')).statSync(output).size;
console.log(`${features.length} il yazildi -> ${output}`);
console.log(`boyut: ${Math.round(boyut / 1024)} KB`);
