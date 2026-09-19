import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

/**
 * Etiket metni alanının tipi.
 *
 * MapLibre ifade tiplerini ('ExpressionSpecification' gibi) dışarı vermiyor;
 * tip, katman tanımının kendisinden çıkarılıyor. Alternatifi her etiket
 * katmanında bir tip zorlaması yazmaktı.
 */
type TextField = NonNullable<NonNullable<Extract<LayerSpecification, { type: 'symbol' }>['layout']>['text-field']>;

/**
 * Yazı tipi adları.
 *
 * Bunlar glyph klasöründeki dizin adlarıyla birebir aynı olmak zorunda:
 * `<glyphs>/Noto Sans Regular/0-255.pbf` gibi. Ad tutmazsa harita çizilir ama
 * üzerinde tek bir etiket görünmez; kurulumda ilk bakılacak yer burasıdır.
 */
const FONT = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold', 'Noto Sans Regular'];

/**
 * Etiketlerde okunacak alan.
 *
 * Karo verisi Türkiye çıkarımından üretildiği için `name` zaten Türkçe geliyor;
 * yine de `name:tr` varsa o tercih ediliyor. İkisi de yoksa etiket boş kalır,
 * bu da çizilmemesi demek.
 */
const NAME: TextField = ['coalesce', ['get', 'name:tr'], ['get', 'name']];

/** Karo arşivindeki veri kaynağının adı; bütün katmanlar buna bakar. */
const SOURCE = 'bankatek';

/** Bir rengin kırmızı/yeşil/mavi bileşenleri. */
interface Channels {
  r: number;
  g: number;
  b: number;
}

/** hsl bileşenlerini rgb'ye çevirir. h derece, s ve l yüzde. */
function fromHsl(h: number, s: number, l: number): Channels {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = ((h % 360) + 360) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const base = lightness - chroma / 2;

  const table: number[][] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];

  const [r, g, b] = table[Math.floor(sector) % 6];

  return { r: (r + base) * 255, g: (g + base) * 255, b: (b + base) * 255 };
}

/**
 * Tema renklerini okur.
 *
 * Paletler iki biçimde yazılmış: elle ayarlanmış temalarda '#0a1f44', üretilmiş
 * temalarda 'hsl(224 45% 8%)'. İkisi de destekleniyor. Tanınmayan biçimde
 * siyah dönüyor; harita çizilmeye devam etsin, renk yüzünden ekran patlamasın.
 */
function parse(color: string): Channels {
  const value = color.trim();

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full = hex.length === 3 ? hex.replace(/./g, (char) => char + char) : hex;

    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const numbers = value.match(/-?\d+(\.\d+)?/g);

  if (value.startsWith('hsl') && numbers && numbers.length >= 3) {
    return fromHsl(Number(numbers[0]), Number(numbers[1]), Number(numbers[2]));
  }

  if (value.startsWith('rgb') && numbers && numbers.length >= 3) {
    return { r: Number(numbers[0]), g: Number(numbers[1]), b: Number(numbers[2]) };
  }

  return { r: 0, g: 0, b: 0 };
}

/** İki bileşeni orana göre karıştırır. */
function blend(from: number, to: number, ratio: number): number {
  return Math.round(Math.min(255, Math.max(0, from + (to - from) * ratio)));
}

/**
 * İki rengi karıştırır ve '#rrggbb' döndürür.
 *
 * MapLibre boya değerlerinde CSS değişkeni çözemiyor; stil kurulurken renklerin
 * somut hale gelmesi gerekiyor. Tema paletinde harita için ayrı renk tutmak
 * yerine var olan renkler karıştırılıyor, böylece yeni bir tema eklendiğinde
 * harita da kendiliğinden ona uyuyor.
 */
function mix(a: string, b: string, ratio: number): string {
  const from = parse(a);
  const to = parse(b);
  const hex = (value: number) => value.toString(16).padStart(2, '0');

  return `#${hex(blend(from.r, to.r, ratio))}${hex(blend(from.g, to.g, ratio))}${hex(blend(from.b, to.b, ratio))}`;
}

/**
 * Rengi '#rrggbb' biçimine çevirir.
 *
 * Tema renkleri CSS'te 'hsl(216 75% 51%)' gibi de yazılabiliyor; MapLibre'in
 * renk çözümleyicisi her CSS biçimini kabul etmiyor. Katman boyası verilmeden
 * önce buradan geçiriliyor, böylece her temada aynı sonuç çıkıyor.
 */
export function toHex(color: string): string {
  const { r, g, b } = parse(color);
  const hex = (value: number) => Math.round(value).toString(16).padStart(2, '0');

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Renge saydamlık ekler. */
function alpha(color: string, value: number): string {
  const { r, g, b } = parse(color);

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${value})`;
}

/** Stil kurulurken verilen adresler ve tema renkleri. */
export interface StyleOptions {
  /** Vektör karo arşivinin adresi. 'pmtiles://' öneki bileşende ekleniyor. */
  tiles: string;
  /** Yazı tipi adresi; '{fontstack}' ve '{range}' yer tutucularını içerir. */
  glyphs: string;
  /** İkon atlası adresi. Boşsa stile eklenmez. */
  sprite: string;
  /** Tema paletinin renkleri: '--color-bg' gibi adlardan değere. */
  colors: Record<string, string>;
}

/**
 * Haritanın kullandığı renkler.
 *
 * Hepsi tema renklerinden türetiliyor. Oranlar koyu zeminde denenerek seçildi:
 * su zeminin biraz üstünde ama vurgu renginden uzak, yol kademeleri birbirinden
 * ayırt edilebilir, bina dolgusu yolun altında kalıyor.
 */
function paletteOf(colors: Record<string, string>) {
  const ground = colors['--color-bg'] ?? '#0a1f44';
  const surface = colors['--color-surface'] ?? '#102a5c';
  const border = colors['--color-border'] ?? '#214b92';
  const strong = colors['--color-border-strong'] ?? '#2f63b8';
  const text = colors['--color-text'] ?? '#ffffff';
  const muted = colors['--color-muted'] ?? '#b9c6e0';
  const accent = colors['--color-accent'] ?? '#2a6fd6';

  return {
    ground,
    water: mix(ground, accent, 0.32),
    waterLine: mix(ground, accent, 0.45),
    green: mix(ground, '#2fbf5f', 0.16),
    built: mix(ground, surface, 0.55),
    building: mix(surface, border, 0.45),
    buildingLine: mix(surface, border, 0.75),
    minor: mix(surface, strong, 0.35),
    major: mix(border, muted, 0.3),
    motorway: mix(accent, muted, 0.3),
    casing: mix(ground, border, 0.55),
    rail: mix(border, ground, 0.35),
    boundary: alpha(strong, 0.75),
    label: text,
    labelSoft: muted,
    halo: alpha(ground, 0.9),
  };
}

/**
 * Çevrimdışı vektör karo için MapLibre stili üretir.
 *
 * Hazır bir stil dosyası indirilmiyor; hazır stiller yazı tipini, ikonu ve
 * çoğu zaman karoyu da internetten çekiyor, kapalı ağda sessizce boş harita
 * bırakıyorlar. Stil burada kurulunca hem bütün adresler kendi sunucumuzu
 * gösteriyor hem de renkler seçili temaya uyuyor.
 *
 * Katman adları OpenMapTiles şemasına göre; karo arşivi Planetiler'in
 * openmaptiles profiliyle üretildiği sürece bu şema geçerli.
 *
 * İkon atlası (sprite) verilse de hiçbir katman ikon kullanmıyor: eksik bir
 * ikon adı MapLibre'de konsolu doldurup o katmanı boş bırakıyor. Etiketler
 * yalnız metinle çiziliyor, böylece atlas hiç kurulmamışsa da harita eksiksiz.
 */
export function buildStyle(options: StyleOptions): StyleSpecification {
  const color = paletteOf(options.colors);

  const style: StyleSpecification = {
    version: 8,
    name: 'Bankatek',
    glyphs: options.glyphs,
    sources: {
      [SOURCE]: {
        type: 'vector',
        url: `pmtiles://${options.tiles}`,
        // Arşiv 14. kademeye kadar üretiliyor; üstü istemcide büyütülüyor.
        // Bu satır olmadan MapLibre 15. kademeden sonra karo istemeyi bırakıp
        // haritayı boşaltıyor.
        maxzoom: 14,
      },
    },
    layers: [
      { id: 'zemin', type: 'background', paint: { 'background-color': color.ground } },
      {
        id: 'bitki',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landcover',
        // Katmanda kum, kaya ve buzul da var; yalnız yeşil olanlar boyanıyor,
        // yoksa çöl ve kayalık da çimen rengine dönüyordu.
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'farmland', 'wetland']]],
        paint: { 'fill-color': color.green, 'fill-opacity': 0.6 },
      },
      {
        id: 'yerlesim',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'commercial', 'industrial', 'retail']]],
        minzoom: 8,
        paint: { 'fill-color': color.built, 'fill-opacity': 0.5 },
      },
      {
        id: 'park',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'park',
        paint: { 'fill-color': color.green, 'fill-opacity': 0.55 },
      },
      {
        id: 'su',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'water',
        paint: { 'fill-color': color.water },
      },
      {
        id: 'akarsu',
        type: 'line',
        source: SOURCE,
        'source-layer': 'waterway',
        minzoom: 9,
        paint: {
          'line-color': color.waterLine,
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 9, 0.6, 16, 3],
        },
      },
      {
        id: 'bina',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': color.building,
          'fill-outline-color': color.buildingLine,
          // 14'te birden belirmesin; yaklaşırken yavaşça açılıyor.
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.5, 0.85],
        },
      },
      {
        id: 'demiryolu',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        // 'rail' ana hat, 'transit' metro ve tramvay. İkisi de aynı çizgiyle
        // gösteriliyor; şehir içi raylı sistemi ayırmak bu ölçekte gereksiz.
        filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]],
        minzoom: 10,
        paint: {
          'line-color': color.rail,
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 10, 0.6, 18, 3],
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'yol-cerceve',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
        minzoom: 7,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color.casing,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 7, 1.6, 12, 6, 18, 26],
        },
      },
      {
        id: 'yol-kucuk',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
        minzoom: 12,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color.minor,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.5, 15, 2, 18, 12],
        },
      },
      {
        id: 'yol-yaya',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        // Yaya yolu, patika, merdiven ve bisiklet yolunun hepsi OpenMapTiles'da
        // 'path' sınıfında toplanıyor; 'pedestrian' ayrı bir sınıf değil,
        // subclass değeri.
        filter: ['==', ['get', 'class'], 'path'],
        minzoom: 14,
        paint: {
          'line-color': color.minor,
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 14, 0.4, 18, 3],
          'line-dasharray': [2, 2],
        },
      },
      {
        id: 'yol-orta',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]],
        minzoom: 9,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color.major,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 0.7, 14, 3, 18, 16],
        },
      },
      {
        id: 'yol-ana',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
        minzoom: 5,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color.motorway,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.6, 12, 4, 18, 20],
        },
      },
      {
        id: 'sinir-ilce',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        // İlçe sınırları yalnızca yakınlaşınca. Ülke ölçeğinde çizildiklerinde
        // harita ağ gibi görünüyor ve illerin boyandığı ekranlarda dolguyla
        // yarışıyorlar.
        filter: ['all', ['>=', ['get', 'admin_level'], 5], ['<=', ['get', 'admin_level'], 6]],
        minzoom: 9,
        paint: { 'line-color': color.boundary, 'line-width': 0.6, 'line-opacity': 0.6, 'line-dasharray': [3, 2] },
      },
      {
        id: 'sinir-il',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 4],
        minzoom: 4,
        paint: { 'line-color': color.boundary, 'line-width': 0.9, 'line-dasharray': [3, 2] },
      },
      {
        id: 'sinir-ulke',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 2],
        paint: {
          'line-color': color.boundary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 10, 2.4],
        },
      },
      {
        id: 'kapi-no',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'housenumber',
        minzoom: 17,
        layout: {
          'text-field': ['get', 'housenumber'],
          'text-font': FONT,
          'text-size': 10,
          'text-padding': 2,
        },
        paint: {
          'text-color': color.labelSoft,
          'text-halo-color': color.halo,
          'text-halo-width': 1,
        },
      },
      {
        id: 'yol-adi',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'transportation_name',
        minzoom: 13,
        layout: {
          'text-field': NAME,
          'text-font': FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 18, 13],
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map',
          'text-padding': 4,
        },
        paint: {
          'text-color': color.label,
          'text-halo-color': color.halo,
          'text-halo-width': 1.4,
        },
      },
      {
        id: 'ilgi-noktasi',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'poi',
        minzoom: 16,
        filter: ['<=', ['get', 'rank'], 12],
        layout: {
          'text-field': NAME,
          'text-font': FONT,
          'text-size': 11,
          'text-anchor': 'top',
          'text-max-width': 9,
          'text-offset': [0, 0.4],
        },
        paint: {
          'text-color': color.labelSoft,
          'text-halo-color': color.halo,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'su-adi',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'water_name',
        minzoom: 6,
        layout: {
          'text-field': NAME,
          'text-font': FONT,
          'text-size': 12,
          'text-max-width': 7,
        },
        paint: {
          'text-color': color.waterLine,
          'text-halo-color': color.halo,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'mahalle-adi',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood', 'hamlet']]],
        minzoom: 13,
        layout: {
          'text-field': NAME,
          'text-font': FONT,
          'text-size': 11,
          'text-max-width': 8,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
        },
        paint: {
          'text-color': color.labelSoft,
          'text-halo-color': color.halo,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'yerlesim-adi',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village']]],
        layout: {
          'text-field': NAME,
          'text-font': FONT_BOLD,
          // Büyük şehir yakınlaşınca büyür, köy her kademede küçük kalır.
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            ['case', ['==', ['get', 'class'], 'city'], 12, 10],
            12,
            ['case', ['==', ['get', 'class'], 'city'], 18, 13],
          ],
          'text-max-width': 8,
        },
        paint: {
          'text-color': color.label,
          'text-halo-color': color.halo,
          'text-halo-width': 1.6,
        },
      },
    ],
  };

  // Atlas verilmediyse anahtar hiç eklenmiyor; boş string MapLibre'de
  // '<origin>/.json' isteğine dönüşüp konsola 404 düşürüyor.
  if (options.sprite) {
    style.sprite = options.sprite;
  }

  return style;
}
