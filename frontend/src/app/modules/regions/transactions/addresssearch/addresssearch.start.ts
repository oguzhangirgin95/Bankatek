import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { GeocodePlace, GeocodeService } from '@lib/services/external/geocodeservice';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { GeoMarker, GeoPick, GeoPlace, GeoPoint, Geomap } from '@lib/commons/geomap/geomap';
import { Info } from '@lib/commons/info/info';
import { Input } from '@lib/commons/input/input';
import { List, ListItem } from '@lib/commons/list/list';
import { Search, SearchResult } from '@lib/commons/search/search';

/**
 * Koordinat basamağı.
 *
 * Altı basamak yaklaşık 11 santimetre; kapı numarası düzeyinde adres için
 * fazlasıyla yeterli, daha fazlası ölçüm hatasının içinde kalıyor.
 */
const DIGITS = 6;

/** Kutusu olmayan sonuçlar için konumun çevresine açılan pay (derece). */
const PADDING = 0.0015;

/**
 * Adres arama ekranı.
 *
 * İki yönlü çalışır: yazılan adresten koordinat (geokodlama), haritada
 * tıklanan koordinattan adres (ters geokodlama). İkisi de kurum içindeki
 * Nominatim'den geliyor, internete çıkılmıyor.
 *
 * Adres sunucusu tanımlı değilse ekran yine açılır: harita gezilebilir, yalnız
 * arama ve adres okuma kapalıdır. Böylece karo arşivi kurulmuş ama adres
 * sunucusu henüz kurulmamış bir ortamda ekran boş kalmıyor.
 */
@Component({
  imports: [Button, Card, FormsModule, Geomap, Info, Input, List, Search],
  templateUrl: './addresssearch.start.html',
  styleUrl: './addresssearch.scss',
})
export class AddresssearchStart extends BaseComponent implements OnInit {
  private readonly geocodeService = inject(GeocodeService);

  private readonly platformId = inject(PLATFORM_ID);

  /** Adres servisi bu ortamda tanımlı mı. */
  readonly enabled = this.geocodeService.enabled;

  /**
   * İl sınırlarının adresi.
   *
   * Burada boyama için değil, tıklanan noktanın hangi ilde olduğunu okumak
   * için gerekiyor; bu tek alan tahmine değil poligona dayanıyor.
   */
  readonly provinces = environment.map.provinces;

  readonly labels = computed(() => ({
    title: this.getResource('ADDRESSSEARCH_TITLE', 'Adres Arama'),
    searchTitle: this.getResource('ADDRESSSEARCH_SEARCH', 'Adres ara'),
    searchHint: this.getResource('ADDRESSSEARCH_SEARCH_HINT', 'Cadde, mahalle, ilçe ya da işyeri adı yazın'),
    searchLabel: this.getResource('ADDRESSSEARCH_LABEL', 'Adres'),
    searchPlaceholder: this.getResource('ADDRESSSEARCH_PLACEHOLDER', 'Örnek: Moda Caddesi 12 Kadıköy'),
    searchEmpty: this.getResource('ADDRESSSEARCH_EMPTY', 'Adres bulunamadı'),
    mapTitle: this.getResource('ADDRESSSEARCH_MAP', 'Harita'),
    mapHint: this.getResource('ADDRESSSEARCH_MAP_HINT', 'Adresini öğrenmek istediğiniz noktaya tıklayın'),
    detailTitle: this.getResource('ADDRESSSEARCH_DETAIL', 'Seçilen adres'),
    detailEmpty: this.getResource('ADDRESSSEARCH_DETAIL_EMPTY', 'Henüz bir adres seçilmedi'),
    disabled: this.getResource('ADDRESSSEARCH_DISABLED', 'Adres servisi bu ortamda tanımlı değil; yalnızca harita gezilebilir.'),
    failed: this.getResource('ADDRESSSEARCH_FAILED', 'Adres servisine ulaşılamadı.'),
    notFound: this.getResource('ADDRESSSEARCH_NOTFOUND', 'Adres servisi bu noktayı doğrulayamadı; gösterilen adres harita verisinden.'),
    offline: this.getResource(
      'ADDRESSSEARCH_OFFLINE',
      'Adres servisi tanımlı değil; adres harita verisinden okundu, doğrulanmadı.',
    ),
    addressField: this.getResource('ADDRESSSEARCH_FIELD', 'Adres'),
    copy: this.getResource('ADDRESSSEARCH_COPY', 'Koordinatı kopyala'),
    copied: this.getResource('ADDRESSSEARCH_COPIED', 'Koordinat kopyalandı'),
    province: this.getResource('ADDRESS_PROVINCE', 'İl'),
    district: this.getResource('ADDRESS_DISTRICT', 'İlçe'),
    neighbourhood: this.getResource('ADDRESS_NEIGHBOURHOOD', 'Mahalle'),
    street: this.getResource('ADDRESS_STREET', 'Cadde / Sokak'),
    houseNumber: this.getResource('ADDRESS_HOUSENUMBER', 'Kapı no'),
    building: this.getResource('ADDRESS_BUILDING', 'Bina / İşyeri'),
    postcode: this.getResource('ADDRESS_POSTCODE', 'Posta kodu'),
    latitude: this.getResource('ADDRESS_LATITUDE', 'Enlem'),
    longitude: this.getResource('ADDRESS_LONGITUDE', 'Boylam'),
    full: this.getResource('ADDRESS_FULL', 'Tam adres'),
  }));

  ngOnInit() {
    this.State.Places = [];
    this.State.Selected = null;
    this.State.Picked = null;
    this.State.Query = '';
    this.State.Place = null;
    this.State.Fit = null;
    this.State.AddressNotice = '';

    this.fill(null, '');
  }

  /**
   * Haritanın altındaki alanları doldurur.
   *
   * Enlem ve boylam tıklanan noktadan, adres ise servisten geliyor; ikisi ayrı
   * zamanlarda hazır olduğu için tek yerden yazılıyorlar.
   */
  private fill(point: GeoPoint | null, address: string): void {
    this.State.Address = address;
    this.State.Latitude = point ? point.latitude.toFixed(DIGITS) : '';
    this.State.Longitude = point ? point.longitude.toFixed(DIGITS) : '';
  }

  /**
   * Gösterilecek konum.
   *
   * Adres bulunduysa onun koordinatı, bulunamadıysa haritada tıklanan nokta.
   * Ayrım önemli: koordinat tıklamanın kendisinden geliyor, yani adres servisi
   * kapalı ya da o noktada kayıtlı adres yokken bile enlem/boylam gösterilebilir.
   */
  readonly position = computed<GeoPoint | null>(() => {
    const place = this.State.Selected as GeocodePlace | null;

    if (place) {
      return { latitude: place.latitude, longitude: place.longitude };
    }

    return (this.State.Picked as GeoPoint | null) ?? null;
  });

  /** Arama kutusunun açılır listesi. */
  readonly results = computed<SearchResult[]>(() =>
    ((this.State.Places ?? []) as GeocodePlace[]).map((place) => ({
      key: place.id,
      text: place.formatted || place.displayName,
      hint: this.format({ latitude: place.latitude, longitude: place.longitude }),
    })),
  );

  /** Haritadaki tek işaret: seçilen ya da tıklanan konum. */
  readonly markers = computed<GeoMarker[]>(() => {
    const point = this.position();

    if (!point) {
      return [];
    }

    const place = this.State.Selected as GeocodePlace | null;

    return [
      {
        id: place?.id ?? 'secilen',
        latitude: point.latitude,
        longitude: point.longitude,
        label: place?.formatted || this.format(point),
      },
    ];
  });

  /**
   * Adresin parçaları.
   *
   * Boş alanlar da listeleniyor, çizgiyle. Hangi bilgi eksik onu görmek bu
   * ekranın asıl işi: OSM verisinde kapı numarası her yerde yok, eksik alanı
   * gizlemek adresi olduğundan tam gösterirdi.
   */
  readonly details = computed<ListItem[]>(() => {
    const point = this.position();

    if (!point) {
      return [];
    }

    const text = this.labels();
    const selected = this.State.Selected as GeocodePlace | null;
    const address = selected?.address;
    const full = selected?.displayName;

    // Adres servisi yanıt verdiyse onun sonucu, vermediyse karolardan okunan
    // adres gösteriliyor. İkincisi tahmine dayalı ama hiç yoktan iyi.
    const tile = (this.State.Place ?? null) as GeoPlace | null;

    return [
      { key: text.province, value: address?.province || (selected ? '' : tile?.province) || '-' },
      { key: text.district, value: address?.district || (selected ? '' : tile?.district) || '-' },
      { key: text.neighbourhood, value: address?.neighbourhood || (selected ? '' : tile?.neighbourhood) || '-' },
      { key: text.street, value: address?.street || (selected ? '' : tile?.street) || '-' },
      { key: text.houseNumber, value: address?.houseNumber || (selected ? '' : tile?.houseNumber) || '-' },
      { key: text.building, value: address?.building || '-' },
      { key: text.postcode, value: address?.postcode || '-' },
      // Koordinat her zaman dolu: adres bulunamasa da tıklanan nokta biliniyor.
      { key: text.latitude, value: point.latitude.toFixed(DIGITS) },
      { key: text.longitude, value: point.longitude.toFixed(DIGITS) },
      { key: text.full, value: full || '-' },
    ];
  });

  /** 'enlem, boylam' biçiminde koordinat metni. */
  format(point: GeoPoint): string {
    return `${point.latitude.toFixed(DIGITS)}, ${point.longitude.toFixed(DIGITS)}`;
  }

  /**
   * Karolardan okunan parçaları tek satırlık adrese dizer.
   *
   * Sıra `GeocodeService.format()` ile aynı tutuldu, böylece adres servisiyle
   * karolardan gelen sonuç aynı biçimde okunuyor.
   */
  private fromPlace(place: GeoPlace): string {
    const line = [place.neighbourhood, place.street, place.houseNumber ? `No:${place.houseNumber}` : '']
      .filter(Boolean)
      .join(' ');

    const area = [place.district, place.province].filter(Boolean).join('/');

    return [line, area].filter(Boolean).join(', ');
  }

  /** Arama kutusundan gelen metinle adres arar. */
  search(text: string): void {
    this.State.AddressNotice = '';

    if (!text) {
      this.State.Places = [];

      return;
    }

    firstValueFrom(this.geocodeService.search(text))
      .then((places) => {
        this.State.Places = places;

        if (!places.length) {
          this.State.AddressNotice = this.labels().searchEmpty;
        }
      })
      .catch((error) => {
        console.error('Adres:', error);
        this.State.Places = [];
        this.State.AddressNotice = this.labels().failed;
      });
  }

  /** Listeden seçilen adresi haritaya taşır. */
  choose(result: SearchResult): void {
    const place = ((this.State.Places ?? []) as GeocodePlace[]).find((item) => item.id === result.key);

    if (!place) {
      return;
    }

    this.State.Selected = place;
    this.State.Picked = null;
    this.State.Query = place.formatted || place.displayName;
    this.State.AddressNotice = '';
    this.State.Fit = this.boundsOf(place);

    this.fill({ latitude: place.latitude, longitude: place.longitude }, place.formatted || place.displayName);
  }

  /**
   * Haritada tıklanan noktanın adresini sorar.
   *
   * Kamera oynatılmıyor: kullanıcı zaten baktığı yere tıkladı, harita altından
   * kayarsa nereye tıkladığını kaybediyor.
   */
  pick(pick: GeoPick): void {
    const point: GeoPoint = { latitude: pick.latitude, longitude: pick.longitude };

    // Koordinat ve karolardan okunan adres tıklamanın kendisinden geliyor;
    // adres servisi beklenmiyor. Servis kapalı olsa bile ekran doluyor.
    this.State.Picked = point;
    this.State.Place = pick.place;
    this.State.Selected = null;
    this.State.Query = this.format(point);
    this.State.AddressNotice = '';

    this.fill(point, this.fromPlace(pick.place));

    if (!this.enabled) {
      this.State.AddressNotice = this.labels().offline;

      return;
    }

    firstValueFrom(this.geocodeService.reverse(point.latitude, point.longitude))
      .then((place) => {
        if (!place) {
          // Karolardan okunan adres ekranda kalıyor; servis yalnızca onu
          // doğrulayamadı, elimizdeki bilgiyi silmek için sebep değil.
          this.State.AddressNotice = this.labels().notFound;

          return;
        }

        this.State.Selected = place;
        this.State.Picked = null;
        this.State.Query = place.formatted || place.displayName;

        this.fill(
          { latitude: place.latitude, longitude: place.longitude },
          place.formatted || place.displayName,
        );
      })
      .catch((error) => {
        console.error('Adres:', error);
        this.State.AddressNotice = this.labels().failed;
      });
  }

  /** Koordinatı panoya kopyalar. */
  copy(): void {
    const point = this.position();

    if (!point || !isPlatformBrowser(this.platformId)) {
      return;
    }

    navigator.clipboard
      ?.writeText(this.format(point))
      .then(() => (this.State.AddressNotice = this.labels().copied))
      .catch((error) => console.error('Adres:', error));
  }

  /**
   * Haritanın yaslanacağı kutu.
   *
   * Nominatim çoğu kayıtta kendi kutusunu veriyor; bina gibi tek noktaya
   * inen kayıtlarda kutu da tek nokta oluyor ve harita son kademeye kadar
   * dalıyordu. Kutu yoksa ya da çok darsa noktanın çevresine pay açılıyor.
   */
  private boundsOf(place: GeocodePlace): [number, number, number, number] {
    const box = place.bounds;

    if (box && box[2] - box[0] > PADDING && box[3] - box[1] > PADDING) {
      return box;
    }

    return [
      place.longitude - PADDING,
      place.latitude - PADDING,
      place.longitude + PADDING,
      place.latitude + PADDING,
    ];
  }
}
