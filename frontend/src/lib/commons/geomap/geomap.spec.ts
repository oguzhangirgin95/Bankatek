import { describe, expect, it } from 'vitest';
import { buildStyle } from './geomap.style';

/** Koyu bir tema paleti; gerçek paletlerle aynı biçimde yazıldı. */
const COLORS: Record<string, string> = {
  '--color-bg': '#0a1f44',
  '--color-surface': 'hsl(224 42% 14%)',
  '--color-border': '#214b92',
  '--color-border-strong': '#2f63b8',
  '--color-text': '#ffffff',
  '--color-muted': 'hsl(224 25% 74%)',
  '--color-accent': 'hsl(216 75% 51%)',
};

const OPTIONS = {
  tiles: '/maps/turkey.pmtiles',
  glyphs: '/maps/fonts/{fontstack}/{range}.pbf',
  sprite: '',
  colors: COLORS,
};

describe('Geomap stili', () => {
  it('karo adresi pmtiles protokoluyle veriliyor', () => {
    const style = buildStyle(OPTIONS);
    const source = style.sources['bankatek'];

    expect(source).toMatchObject({ type: 'vector', url: 'pmtiles:///maps/turkey.pmtiles' });
  });

  it('kaynagin maxzoom u 14', () => {
    // Arsiv 14'e kadar uretiliyor; bu deger dususe harita 15'ten sonra bosalir.
    expect(buildStyle(OPTIONS).sources['bankatek']).toMatchObject({ maxzoom: 14 });
  });

  it('yazi tipi adresi stile giriyor', () => {
    expect(buildStyle(OPTIONS).glyphs).toBe('/maps/fonts/{fontstack}/{range}.pbf');
  });

  it('ikon atlasi bos birakildiysa anahtar hic eklenmiyor', () => {
    // Bos string '<origin>/.json' istegine donusup konsola 404 dusuruyordu.
    expect('sprite' in buildStyle(OPTIONS)).toBe(false);
    expect(buildStyle({ ...OPTIONS, sprite: '/maps/sprite/sprite' }).sprite).toBe('/maps/sprite/sprite');
  });

  it('bekledigimiz butun katmanlar var', () => {
    const style = buildStyle(OPTIONS);
    const layers = style.layers.map((layer) => ('source-layer' in layer ? layer['source-layer'] : ''));

    // Bunlarin hepsi Planetiler'in openmaptiles profilinde uretiliyor; ad
    // tutmazsa katman sessizce bos kalir.
    for (const name of [
      'water',
      'waterway',
      'landcover',
      'landuse',
      'park',
      'building',
      'boundary',
      'transportation',
      'transportation_name',
      'housenumber',
      'place',
      'poi',
      'water_name',
    ]) {
      expect(layers).toContain(name);
    }
  });

  it('ilce sinirlari yalnizca yakinlasinca ciziliyor', () => {
    // Ulke olceginde ilce sinirlari cizildiginde harita ag gibi gorunuyor ve
    // il boyamasiyla yarisiyorlar.
    const layers = buildStyle(OPTIONS).layers;
    const il = layers.find((layer) => layer.id === 'sinir-il');
    const ilce = layers.find((layer) => layer.id === 'sinir-ilce');

    expect(il).toMatchObject({ minzoom: 4 });
    expect(ilce).toMatchObject({ minzoom: 9 });
  });

  it('kapi numaralari en yakin kademede ciziliyor', () => {
    const layer = buildStyle(OPTIONS).layers.find((item) => item.id === 'kapi-no');

    expect(layer).toBeDefined();
    expect(layer).toMatchObject({ type: 'symbol', minzoom: 17 });
  });

  it('renkler temadan turetiliyor ve somut degere cevriliyor', () => {
    const style = buildStyle(OPTIONS);
    const background = style.layers.find((layer) => layer.type === 'background');

    // MapLibre boya degerlerinde CSS degiskeni cozemiyor; 'var(--...)' kalirsa
    // katman hic cizilmez.
    expect(JSON.stringify(style)).not.toContain('var(--');
    expect(background).toMatchObject({ paint: { 'background-color': '#0a1f44' } });
  });

  it('hsl yazilmis tema rengi de okunuyor', () => {
    const style = buildStyle(OPTIONS);
    const water = style.layers.find((layer) => layer.id === 'su');
    const color = (water as { paint?: { 'fill-color'?: string } }).paint?.['fill-color'];

    // Siyaha dusmusse parse() bicimi taniyamamis demektir.
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(color).not.toBe('#000000');
  });
});

describe('MapLibre modul bicimi', () => {
  it('dinamik import bilesenin kullandigi parcalari veriyor', async () => {
    // maplibre-gl bir UMD paketi; derleyici 'not ESM' uyarisi veriyor. Isimli
    // disa aktarimlar bundler'in interop katmaniyla olusuyor, paket
    // guncellendiginde sessizce kaybolabilirler: kaybolursa harita calisma
    // aninda 'undefined is not a constructor' ile duser, derleme uyarmaz.
    const maplibre = await import('maplibre-gl');

    expect(typeof maplibre.Map).toBe('function');
    expect(typeof maplibre.Marker).toBe('function');
    expect(typeof maplibre.NavigationControl).toBe('function');
    expect(typeof maplibre.ScaleControl).toBe('function');
    expect(typeof maplibre.addProtocol).toBe('function');
    expect(typeof maplibre.removeProtocol).toBe('function');
  });

  it('pmtiles protokolu kurulabiliyor', async () => {
    const pmtiles = await import('pmtiles');
    const protocol = new pmtiles.Protocol();

    expect(typeof protocol.tile).toBe('function');
  });
});
