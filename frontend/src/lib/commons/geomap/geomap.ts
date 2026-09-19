import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { LngLatBoundsLike, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { environment } from '@env/environment';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { InfoVariant } from '../info/info';
import { buildStyle, toHex } from './geomap.style';

/** Harita üzerinde gösterilen tek bir işaret. */
export interface GeoMarker {
  /** Tıklandığında dışarı verilen kimlik. */
  id: string;
  latitude: number;
  longitude: number;
  /** İşaretin üzerine gelindiğinde çıkan metin. */
  label?: string;
  /**
   * İşaretin üstünde görünecek kısa metin; genelde bir sayı.
   *
   * Verilirse işaret damla yerine yuvarlak bir rozete dönüşür ve metin içine
   * yazılır. Şehir başına müşteri sayısı gibi değerlerde, sayıyı görmek için
   * her işaretin üzerine gelmek gerekmiyor.
   */
  text?: string;
  /** İşaretin rengi. Boş bırakılırsa temanın vurgu rengi. */
  variant?: InfoVariant | '';
}

/** Haritadan okunan ya da haritaya verilen konum. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Karo verisinden okunan adres parçaları.
 *
 * Bulunamayan parça boş string döner. Bu bir geokodlayıcı değil: en yakın
 * çizili nesneden türetilmiş bir tahmin. Kesin adres için adres servisi
 * (Nominatim) kullanılmalı; bu, servis yokken elde kalan bilgi.
 */
export interface GeoPlace {
  province: string;
  district: string;
  neighbourhood: string;
  street: string;
  houseNumber: string;
}

/** Haritada seçilen nokta ve o noktada okunabilen adres. */
export interface GeoPick extends GeoPoint {
  place: GeoPlace;
}

/** Sınırları boyanacak bölge; kimlik GeoJSON'daki `code` ile eşleşir. */
export interface GeoRegion {
  id: string;
  /** Yoğunluk. Rengin koyuluğunu bu belirler. */
  value: number;
}

/** Bölge katmanlarının ve kaynağının adları. */
const REGION_SOURCE = 'bolge';
const REGION_FILL = 'bolge-dolgu';
const REGION_LINE = 'bolge-cizgi';
const REGION_ACTIVE = 'bolge-secili';

/**
 * Yoğunluk kademelerinin opaklıkları.
 *
 * Üst sınır 0.7: daha koyusu altındaki yolları ve şehir adlarını tamamen
 * örtüyor, harita boyalı bir lekeye dönüşüyordu.
 */
const REGION_OPACITY = [0.18, 0.3, 0.42, 0.54, 0.68];

/**
 * Gezinme sınırı: [batı, güney, doğu, kuzey].
 *
 * Karo arşivi yalnızca Türkiye verisini taşıdığı için dışarı kaydırıldığında
 * harita boşalıyordu; gezinme bu kutuyla sınırlanıyor.
 *
 * Kutu ülkeden belirgin şekilde geniş, özellikle dikeyde. Nedeni şu: MapLibre
 * görüntünün bu kutunun dışına taşmasına izin vermiyor ve taşacaksa
 * yakınlaştırarak engelliyor. Kutu ülkeye yapışık olduğunda, geniş bir kartta
 * ülkenin boyunu sığdırmak için gereken kademe dikeyde kutudan fazlasını
 * göstereceği için reddediliyor, harita yakınlaşıyor ve doğu ile batı
 * kırpılıyordu. Fazladan pay bu çekişmeyi ortadan kaldırıyor.
 */
const TURKEY: LngLatBoundsLike = [
  [24.0, 33.5],
  [46.5, 44.5],
];

/** Haritanın başlangıç konumu: ülkenin ortası. */
const CENTER: GeoPoint = { latitude: 39.1, longitude: 35.2 };

/** Varsayılan yakınlaşma; merkez verilmediğinde kullanılmıyor. */
const ZOOM = 5.5;

/**
 * Ülkenin kendi sınır kutusu: [batı, güney, doğu, kuzey].
 *
 * Gezinme sınırı olan TURKEY'den dar, çünkü o kutu kenarlara pay bırakıyor.
 * Harita bu kutuya sığdırılarak açılıyor.
 */
const COUNTRY: LngLatBoundsLike = [
  [25.6, 35.8],
  [44.9, 42.2],
];

/**
 * Zorunlu kaynak bilgisi.
 *
 * İki ayrı lisans: veri OSM'den geliyor (ODbL), karo şeması OpenMapTiles'dan
 * (CC-BY). İkisi de veriyi gösteren her yerde kaynağın belirtilmesini istiyor;
 * kapalı ağda da geçerli. Planetiler'in çıktısı da bu iki satırı basıyor.
 */
const ATTRIBUTION = '© OpenMapTiles © OpenStreetMap katkıcıları';

/**
 * pmtiles protokolü tarayıcı başına bir kez tanıtılır.
 *
 * Aynı sayfada iki harita varsa ikinci tanıtım MapLibre'de hata veriyor; sayaç
 * da bunun için: son harita kapanmadan protokol kaldırılmamalı.
 */
let protocolUsers = 0;

/**
 * Damla biçimli işaretin çizimi.
 *
 * Şekil SVG olarak üretiliyor, CSS ile değil. Önceki hali bir kutuyu
 * `transform: rotate(-45deg)` ile döndürüyordu ama MapLibre işaretin
 * `transform` özelliğini konumlandırma için kendisi yazıyor: satır içi değer
 * her zaman kazanıyor, dönme hiç uygulanmıyordu. SVG'nin geometrisi
 * `transform`'a hiç dokunmadığı için bu çakışma ortadan kalkıyor.
 *
 * `createElementNS` ile kuruluyor; innerHTML kullanılmıyor.
 */
function pinElement(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');

  svg.setAttribute('viewBox', '0 0 24 32');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '27');
  svg.setAttribute('aria-hidden', 'true');

  const body = document.createElementNS(ns, 'path');
  body.setAttribute('d', 'M12 1C6 1 1.2 5.8 1.2 11.8 1.2 20 12 31 12 31s10.8-11 10.8-19.2C22.8 5.8 18 1 12 1z');
  body.setAttribute('class', 'app-geomap__pin-body');

  const eye = document.createElementNS(ns, 'circle');
  eye.setAttribute('cx', '12');
  eye.setAttribute('cy', '11.8');
  eye.setAttribute('r', '4');
  eye.setAttribute('class', 'app-geomap__pin-eye');

  svg.append(body, eye);

  return svg;
}

/**
 * Sokak seviyesinde harita.
 *
 * Veri internetten gelmiyor: vektör karo arşivi (pmtiles), yazı tipleri ve
 * ikonlar kurum içindeki bir sunucudan okunuyor, adresleri ortam dosyası
 * söylüyor. Karo arşivi 14. kademeye kadar üretilse de sokak ve bina
 * geometrisi vektör olduğu için istemci 20. kademeye kadar net büyütüyor.
 *
 * MapLibre yalnızca tarayıcıda çalışır; bütün kurulum `afterNextRender`
 * içinde ve kitaplık dinamik `import` ile yükleniyor. İkisinin de nedeni var:
 * sunucu tarafı render'ında `window` yok, ve kitaplık yaklaşık 230 KB — statik
 * import edilseydi haritayı hiç açmayan ekranlar da onu indirirdi.
 *
 * İşaretler DOM öğesi olarak çiziliyor; birkaç yüz taneye kadar sorunsuz.
 * Binlerce nokta gerekirse işaretler yerine GeoJSON kaynağı ve circle katmanı
 * kullanılmalı.
 */
@Component({
  selector: 'app-geomap',
  imports: [],
  templateUrl: './geomap.html',
  styleUrl: './geomap.scss',
  // Projedeki tek kapsüllemesiz bileşen. İki nedeni var: MapLibre'in kendi
  // stili (denetimler, ölçek, kaynak satırı) kapsüllenmiş bir dosyadan
  // uygulanamıyor, ve işaretler şablonda değil JavaScript'te üretildiği için
  // Angular'ın eklediği öznitelik seçicileri onlara hiç uymuyor. Sınıf adları
  // 'app-geomap' ve 'maplibregl' önekleriyle ayrıldığı için sızıntı riski yok.
  encapsulation: ViewEncapsulation.None,
})
export class Geomap extends BaseComponent {
  /** Haritanın başlangıç merkezi. */
  readonly center = input<GeoPoint>(CENTER);

  /**
   * Başlangıç yakınlaşma kademesi; 17 sokak seviyesidir.
   *
   * Dokunulmazsa harita kademe yerine ülke kutusuna sığdırılarak açılır.
   */
  readonly zoom = input<number>(ZOOM);

  /** Gösterilecek işaretler. */
  readonly markers = input<GeoMarker[]>([]);

  /** Vurgulanacak işaretin kimliği. */
  readonly selectedId = input<string>('');

  /** Alanın en-boy oranı; yükseklik bundan hesaplanır. */
  readonly ratio = input<string>('16 / 9');

  /** Kullanıcı haritayı kaydırıp yakınlaştırabilir mi. */
  readonly interactive = input<boolean>(true);

  /** Gezinme Türkiye sınırlarıyla kısıtlansın mı. */
  readonly bounded = input<boolean>(true);

  /**
   * Haritaya tıklayınca konum seçilsin mi.
   *
   * Açıkken imleç artı işaretine dönüşür ve her tıklama `picked` çıkışını
   * tetikler; ekran o konumun adresini sorabilir.
   */
  readonly picking = input<boolean>(false);

  /** Haritanın yaslanacağı kutu: [batı, güney, doğu, kuzey]. */
  readonly fit = input<[number, number, number, number] | null>(null);

  /**
   * Sınır geometrisini taşıyan GeoJSON'un adresi.
   *
   * Boş bırakılırsa bölge katmanları hiç kurulmaz. Vektör karodaki `boundary`
   * katmanı yalnızca çizgi taşıdığı için dolgu buradan geliyor.
   */
  readonly regionSource = input<string>('');

  /** Boyanacak bölgeler. Listede olmayan bölge boyanmaz. */
  readonly regions = input<GeoRegion[]>([]);

  /** Bölgelerin rengi. Boş bırakılırsa temanın vurgu rengi. */
  readonly regionVariant = input<InfoVariant | ''>('');

  /** Tıklanan bölge. */
  readonly regionClicked = output<GeoRegion>();

  /** Tıklanan konum ve orada okunabilen adres. Yalnızca `picking` açıkken gelir. */
  readonly picked = output<GeoPick>();

  /** Tıklanan işaret. */
  readonly markerClicked = output<GeoMarker>();

  /** Harita çizime hazır mı. */
  readonly ready = signal<boolean>(false);

  /** Kurulum başarısızsa gösterilecek metin; yoksa boş. */
  readonly error = signal<string>('');

  /** Ortam dosyasında karo arşivi tanımlı mı. */
  readonly configured = environment.map.tiles.trim().length > 0;

  readonly labels = computed(() => ({
    loading: this.getResource('GEOMAP_LOADING', 'Harita yükleniyor'),
    failed: this.getResource('GEOMAP_FAILED', 'Harita yüklenemedi'),
    missing: this.getResource('GEOMAP_MISSING', 'Harita verisi tanımlı değil'),
    missingHint: this.getResource('GEOMAP_MISSING_HINT', 'Karo arşivinin adresi ortam dosyasında boş.'),
    failedHint: this.getResource('GEOMAP_FAILED_HINT', 'Harita sunucusuna ulaşılamıyor.'),
  }));

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  /** Kurulan harita; sunucu tarafında ve kurulum bitmeden null. */
  private map: MapLibreMap | null = null;

  /** Dinamik yüklenen kitaplık; işaret oluştururken yeniden gerekiyor. */
  private library: typeof import('maplibre-gl') | null = null;

  /** Çizili işaretler. Girdi değiştiğinde hepsi silinip yeniden kuruluyor. */
  private pins: MapLibreMarker[] = [];

  /** Bölge dinleyicileri kuruldu mu; ikinci kez kurulmalarını engeller. */
  private regionEvents = false;

  constructor() {
    super();

    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.start();

      destroyRef.onDestroy(() => this.stop());
    });

    // Tema değişince stil yeniden kuruluyor. setStyle katmanları değiştirir,
    // işaretler DOM öğesi olduğu için yerlerinde kalır.
    effect(() => {
      const colors = this.paletteColors();
      const map = this.map;

      if (!map) {
        return;
      }

      map.setStyle(this.styleOf(colors));

      // Yeni stil bölge katmanlarını da götürüyor; stil oturur oturmaz geri
      // kuruluyorlar. 'once' bilerek: 'styledata' kaynak her veri aldığında da
      // tetikleniyor ve sürekli dinlenirse kendi eklediğimiz kaynak yüzünden
      // döngüye giriyor.
      map.once('styledata', () => this.paintRegions(this.regions(), this.regionVariant(), this.selectedId()));
    });

    // İşaretler ve seçim; harita hazır olmadan çizilemez, o yüzden ready()
    // de okunuyor: hazır olduğu anda effect yeniden çalışıp işaretleri kurar.
    effect(() => {
      const markers = this.markers();
      const selected = this.selectedId();

      if (!this.ready()) {
        return;
      }

      this.draw(markers, selected);
    });

    // Dışarıdan kutu verilirse harita ona yaslanır. Arama sonucu seçildiğinde
    // ekranın ayrıca kamera yönetmesi gerekmesin diye bileşenin işi.
    effect(() => {
      const box = this.fit();

      if (!this.ready() || !box || !this.map) {
        return;
      }

      this.map.fitBounds(
        [
          [box[0], box[1]],
          [box[2], box[3]],
        ],
        { padding: 48, maxZoom: 17, duration: 600 },
      );
    });

    // Bölge boyaması. Tema değişince stil baştan kurulduğu için katmanlar da
    // gidiyor; paletin okunması bu effect'i o anda yeniden çalıştırıyor ve
    // katmanlar kendiliğinden geri geliyor.
    effect(() => {
      const regions = this.regions();
      const variant = this.regionVariant();
      const selected = this.selectedId();

      // Renkler CSS değişkenlerinden okunuyor; tema değişince bu effect'in de
      // yeniden çalışması için seçili palet burada izleniyor.
      this.themeService.current();

      if (!this.ready()) {
        return;
      }

      this.paintRegions(regions, variant, selected);
    });
  }

  /** Seçili temanın renkleri; stil bunlardan kuruluyor. */
  private readonly paletteColors = computed<Record<string, string>>(() => {
    const code = this.themeService.current();

    return this.themeService.palettes.find((palette) => palette.code === code)?.colors ?? {};
  });

  private styleOf(colors: Record<string, string>) {
    return buildStyle({
      tiles: environment.map.tiles,
      glyphs: environment.map.glyphs,
      sprite: environment.map.sprite,
      colors,
    });
  }

  /**
   * Haritayı kurar.
   *
   * Karo adresi tanımlı değilse kitaplık hiç indirilmiyor; ekranda 'tanımlı
   * değil' durumu kalıyor. Böylece adres servisi olmayan bir ortamda 230 KB
   * boşuna inmiyor.
   */
  private async start(): Promise<void> {
    if (!this.configured) {
      return;
    }

    try {
      const [maplibre, pmtiles] = await Promise.all([import('maplibre-gl'), import('pmtiles')]);

      this.library = maplibre;

      if (protocolUsers === 0) {
        const protocol = new pmtiles.Protocol();
        maplibre.addProtocol('pmtiles', protocol.tile);
      }

      protocolUsers += 1;

      const map = new maplibre.Map({
        container: this.host().nativeElement,
        style: this.styleOf(this.paletteColors()),
        /*
         * Merkez ya da yakınlaşma verilmediyse harita ülkeyi kutusuna
         * sığdırarak açılıyor.
         *
         * Sabit bir kademe kartın en-boy oranına bağlı: aynı 5.5 değeri geniş
         * bir kartta ülkeyi ortalıyor, dar bir kartta doğuyu ve batıyı dışarıda
         * bırakıyordu. fitBounds ölçüyü kutudan ve kabın boyutundan hesapladığı
         * için hangi orana konursa konsun ülkenin tamamı görünüyor.
         */
        ...(this.center() !== CENTER || this.zoom() !== ZOOM
          ? { center: [this.center().longitude, this.center().latitude] as [number, number], zoom: this.zoom() }
          : { bounds: COUNTRY, fitBoundsOptions: { padding: 16 } }),
        interactive: this.interactive(),
        maxBounds: this.bounded() ? TURKEY : undefined,
        attributionControl: { compact: true, customAttribution: ATTRIBUTION },
        // Karo arşivi 14'e kadar üretiliyor; üstü vektörden büyütülüyor.
        maxZoom: 20,
      });

      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibre.ScaleControl({ unit: 'metric' }), 'bottom-left');

      map.on('load', () => this.ready.set(true));

      /*
       * Bölge katmanları için güvenlik ağı.
       *
       * Katmanlar ancak stil oturduktan sonra eklenebiliyor ve o anı tek bir
       * olaya bağlamak kırılgan: veri, stil ve kamera farklı zamanlarda
       * hazır oluyor. 'idle' harita her durulduğunda tetikleniyor; katmanlar
       * hâlâ yoksa kurulum burada tamamlanıyor. Katman varsa hiçbir şey
       * yapılmıyor, yani sürekli boyama yükü yok.
       */
      map.on('idle', () => {
        if (!map.getLayer(REGION_FILL)) {
          this.paintRegions(this.regions(), this.regionVariant(), this.selectedId());
        }
      });

      map.on('click', (event) => {
        if (!this.picking()) {
          return;
        }

        // Bölge boyalıysa oraya yapılan tıklama bölgenin kendi olayına ait.
        // MapLibre katman dinleyicisiyle genel dinleyiciyi birbirinden
        // ayırmıyor, ikisi de tetikleniyor; ayrım burada yapılıyor.
        const onRegion =
          !!map.getLayer(REGION_FILL) && map.queryRenderedFeatures(event.point, { layers: [REGION_FILL] }).length > 0;

        if (!onRegion) {
          this.picked.emit({
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
            place: this.placeAt(map, event.point),
          });
        }
      });

      // Eksik tek bir karo da buraya düşüyor; harita zaten çizildiyse durum
      // değiştirilmiyor, yoksa ilk yükleme hatası ekranda görünmezdi.
      map.on('error', (event) => {
        console.error('Geomap:', event.error);

        if (!this.ready()) {
          this.error.set(this.labels().failed);
        }
      });

      this.map = map;
    } catch (reason) {
      console.error(reason);
      this.error.set(this.labels().failed);
    }
  }

  /** Haritayı ve protokolü bırakır. */
  private stop(): void {
    this.pins.forEach((pin) => pin.remove());
    this.pins = [];

    this.map?.remove();
    this.map = null;

    if (!this.library) {
      return;
    }

    protocolUsers = Math.max(0, protocolUsers - 1);

    if (protocolUsers === 0) {
      this.library.removeProtocol('pmtiles');
    }

    this.library = null;
  }

  /**
   * İşaretleri yeniden çizer.
   *
   * Fark alınmıyor, hepsi silinip yeniden kuruluyor: işaret sayısı birkaç yüzü
   * geçmediği sürece bu, kimliğe göre eşleştirme tutmaktan hem daha kısa hem
   * daha az hata çıkaran yol.
   */
  private draw(markers: GeoMarker[], selected: string): void {
    if (!this.map || !this.library) {
      return;
    }

    this.pins.forEach((pin) => pin.remove());

    this.pins = markers.map((marker) => {
      const element = document.createElement('button');
      const badge = !!marker.text;

      element.type = 'button';
      element.className = `app-geomap__pin app-geomap__pin--${marker.variant || 'accent'}`;
      element.title = marker.label ?? '';

      if (badge) {
        element.classList.add('app-geomap__pin--badge');
        element.textContent = marker.text ?? '';
      } else {
        element.append(pinElement());
      }

      if (marker.id && marker.id === selected) {
        element.classList.add('app-geomap__pin--selected');
      }

      element.addEventListener('click', (event) => {
        // Tıklama haritaya da ulaşırsa seçim modunda işaretin altındaki konum
        // seçilmiş oluyordu.
        event.stopPropagation();
        this.markerClicked.emit(marker);
      });

      /*
       * Damlanın ucu konumu gösteriyor. Rozet ise konumun biraz üstüne
       * kaydırılıyor: tam üstüne konduğunda haritanın kendi şehir adını
       * örtüyordu. DOM işaretleri MapLibre'in etiket çakışma çözümüne dahil
       * olmadığı için mesafeyi burada açmak gerekiyor.
       */
      return new this.library!.Marker({
        element,
        anchor: badge ? 'center' : 'bottom',
        offset: badge ? [0, -20] : [0, 0],
      })
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(this.map!);
    });
  }

  /**
   * Yoğunluk kademelerinin alt sınırları.
   *
   * Değer aralığına değil sıralamaya göre bölünüyor. Müşteri dağılımı çarpık:
   * birkaç büyük şehir ve çok sayıda küçük il var, eşit aralıklı bölme illerin
   * neredeyse tamamını en açık tonda topluyordu. Aynı yaklaşım SVG haritasında
   * da kullanılıyor (`lib/commons/map/map.ts`).
   */
  private thresholdsOf(regions: GeoRegion[]): number[] {
    const values = [...new Set(regions.map((region) => region.value))].sort((a, b) => a - b);

    return REGION_OPACITY.map((_, index) => values[Math.floor((index * values.length) / REGION_OPACITY.length)] ?? 0);
  }

  /**
   * Bölge katmanlarını kurar ve boyar.
   *
   * Katmanlar ilk çağrıda ekleniyor, sonraki çağrılarda yalnızca boya
   * güncelleniyor. İki kez eklenmemesi önemli: MapLibre aynı kimlikli katmanda
   * hata fırlatıyor ve harita orada duruyor.
   */
  private paintRegions(regions: GeoRegion[], variant: InfoVariant | '', selected: string): void {
    const map = this.map;
    const url = this.regionSource();

    if (!map || !url) {
      return;
    }

    const color = toHex(this.cssVar(variant ? `--color-${variant}` : '--color-accent') || '#2a6fd6');

    if (!map.getLayer(REGION_FILL)) {
      /*
       * Katman ancak stil oturduktan sonra eklenebiliyor.
       *
       * isStyleLoaded() yalnızca stilin değil karoların da yüklenmiş olmasına
       * bakıyor ve harita her hareket ettiğinde yeniden false'a düşüyor; bu
       * çağrı o yüzden sonuçsuz kalabilir. Kurulum kaçırılmıyor, çünkü start()
       * içindeki 'idle' dinleyicisi harita her durulduğunda tekrar deniyor.
       */
      if (!map.isStyleLoaded()) {
        return;
      }

      // Tema değişiminde setStyle katmanları siliyor ama kaynak da gidiyor;
      // yine de ayrı kontrol ediliyor, çünkü var olan bir kaynağı yeniden
      // eklemek MapLibre'de hata fırlatıyor.
      if (!map.getSource(REGION_SOURCE)) {
        map.addSource(REGION_SOURCE, { type: 'geojson', data: url });
      }

      // Dolgu etiketlerin altına giriyor; üstüne konsaydı şehir adlarını ve
      // kapı numaralarını örterdi. Stildeki ilk symbol katmanı sınır kabul
      // ediliyor, böylece katman adlarına bağımlılık kalmıyor.
      const label = map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id;

      map.addLayer({ id: REGION_FILL, type: 'fill', source: REGION_SOURCE, paint: { 'fill-color': color } }, label);

      map.addLayer(
        {
          id: REGION_LINE,
          type: 'line',
          source: REGION_SOURCE,
          // Sokak seviyesinde il sınırı bilgi vermiyor, yalnızca kalabalık
          // ediyor. Dolgu katmanı kapatılmıyor: adres okunurken noktanın hangi
          // ilde olduğu ondan sorulıyor ve saydam da olsa sorgulanabiliyor.
          maxzoom: 11,
          paint: { 'line-color': color, 'line-width': 1, 'line-opacity': 0.55 },
        },
        label,
      );

      map.addLayer(
        {
          id: REGION_ACTIVE,
          type: 'line',
          source: REGION_SOURCE,
          paint: { 'line-color': toHex(this.cssVar('--color-text') || '#ffffff'), 'line-width': 2 },
          filter: ['==', ['get', 'code'], ''],
        },
        label,
      );

    }

    /*
     * Dinleyiciler katman kurulumundan ayrı.
     *
     * Katmanlar tema her değiştiğinde yeniden kuruluyor ama dinleyiciler
     * haritanın üzerinde duruyor, stille birlikte silinmiyorlar. Kurulum
     * bloğunun içinde kalsalardı her tema değişiminde bir kopya daha eklenir,
     * tek tıklama birden çok kez bildirilirdi.
     *
     * Bölge listesi de kapanıştan değil her tıklamada girdiden okunuyor; aksi
     * halde veri güncellendiğinde eski liste sorgulanır, tıklama sessizce
     * düşerdi.
     */
    if (!this.regionEvents) {
      this.regionEvents = true;

      map.on('click', REGION_FILL, (event) => {
        const code = event.features?.[0]?.properties?.['code'];
        const region = this.regions().find((item) => item.id === code);

        if (region) {
          this.regionClicked.emit(region);
        }
      });

      map.on('mouseenter', REGION_FILL, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', REGION_FILL, () => (map.getCanvas().style.cursor = ''));
    }

    const thresholds = this.thresholdsOf(regions);

    // Her bölgenin opaklığı kendi kademesinden geliyor; listede olmayan bölge
    // saydam kalıyor, yani boyanmamış görünüyor.
    const steps = regions.flatMap((region) => {
      const index = thresholds.filter((threshold) => region.value >= threshold).length - 1;

      return [region.id, REGION_OPACITY[Math.max(0, index)]];
    });

    /*
     * Boya güncellemesi bilerek bu kontrolün dışında.
     *
     * Veri servisten katmanlar kurulduktan sonra geliyor ve o anda karolar
     * hâlâ yükleniyor olabiliyor. Buraya da bir stil kontrolü konulduğunda
     * güncelleme sessizce düşüyor, bölgeler ilk yazılan boş değerde kalıyordu.
     */
    map.setPaintProperty(REGION_FILL, 'fill-color', color);
    map.setPaintProperty(REGION_LINE, 'line-color', color);
    map.setPaintProperty(REGION_FILL, 'fill-opacity', steps.length ? ['match', ['get', 'code'], ...steps, 0] : 0);

    map.setFilter(REGION_ACTIVE, ['==', ['get', 'code'], selected]);
  }

  /**
   * Tıklanan noktadaki adresi karo verisinden okur.
   *
   * Adres servisi olmayan kurulumlarda elde kalan tek kaynak karoların kendisi.
   * Sokak adı, kapı numarası, mahalle ve yerleşim adı zaten haritayı çizmek
   * için yüklenmiş durumda; `queryRenderedFeatures` imlecin çevresindeki
   * kutuda hangi nesnelerin olduğunu söylüyor.
   *
   * İki sınırı var, ikisi de veriden değil yöntemden geliyor:
   *
   * - Yalnızca o an çizili olan katmanlar sorgulanabiliyor. Sokak adı ve kapı
   *   numarası ancak yeterince yakınlaşınca çiziliyor, uzaktan tıklamada bu
   *   alanlar boş kalır.
   * - En yakın nesne alınıyor, nokta hangi parselin içinde diye bakılmıyor.
   *   Yani sonuç "buraya en yakın sokak", kesin adres değil.
   *
   * İl bunların dışında: sınır poligonundan geldiği için nokta hangi ilin
   * içindeyse o çıkıyor, tahmin değil.
   */
  private placeAt(map: MapLibreMap, point: { x: number; y: number }): GeoPlace {
    /** Verilen katmanlarda, imlecin çevresindeki kutuda ilk eşleşen alan. */
    const near = (layers: string[], field: string, radius: number): string => {
      const existing = layers.filter((layer) => map.getLayer(layer));

      if (!existing.length) {
        return '';
      }

      const box: [[number, number], [number, number]] = [
        [point.x - radius, point.y - radius],
        [point.x + radius, point.y + radius],
      ];

      for (const feature of map.queryRenderedFeatures(box, { layers: existing })) {
        const value = feature.properties?.[field];

        if (value) {
          return String(value);
        }
      }

      return '';
    };

    return {
      // Nokta poligonun içinde mi diye bakılıyor, bu yüzden yarıçap sıfır.
      province: near([REGION_FILL], 'name', 0),
      district: near(['yerlesim-adi'], 'name', 60),
      neighbourhood: near(['mahalle-adi'], 'name', 60),
      street: near(['yol-adi'], 'name', 24),
      houseNumber: near(['kapi-no'], 'housenumber', 12),
    };
  }

  /**
   * Bir tema değişkeninin o anki değeri.
   *
   * Vurgu dışındaki renkler (başarı, uyarı, hata...) palet nesnesinde değil,
   * styles.scss'teki :root bloğunda duruyor; oradan ancak hesaplanmış stille
   * okunabiliyorlar. ThemeService seçilen paleti aynı yere yazdığı için bu
   * okuma her temada doğru değeri veriyor.
   */
  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** Haritayı verilen konuma taşır. Ekranlar arama sonucunda çağırabilir. */
  public flyTo(point: GeoPoint, zoom = 17): void {
    this.map?.flyTo({ center: [point.longitude, point.latitude], zoom, duration: 800 });
  }
}
