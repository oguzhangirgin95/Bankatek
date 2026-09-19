import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '@env/environment';

/** Ortam dosyasında tanımlı adres sunucusu; boş bırakılabilir. */
const configured = environment.geocode.url.trim();

/**
 * Servisin kök adresi; ortam dosyasındaki geocodeUrl'den gelir.
 *
 * Adres boşsa burası da boş kalır. Boşken sonuna eğik çizgi eklenip `'/'`
 * bırakılsaydı uygulamanın bütün göreli istekleri (`/api/...` dahil) bu
 * servise aitmiş gibi görünür, interceptor hepsine karışırdı.
 */
export const GEOCODE_BASE_PATH = configured ? (configured.endsWith('/') ? configured : `${configured}/`) : '';

/**
 * Bir adresin parçaları.
 *
 * Alan adları Türkiye adres düzenine göre seçildi; OSM'in kendi alanlarıyla
 * birebir örtüşmüyor, eşleme servisin içinde yapılıyor. Bulunamayan parça boş
 * string döner, undefined dönmez: ekranlar her alanı doğrudan basabilsin diye.
 */
export interface GeocodeAddress {
  /** İl. */
  province: string;
  /** İlçe. */
  district: string;
  /** Mahalle ya da köy. */
  neighbourhood: string;
  /** Cadde, sokak, bulvar ya da meydan. */
  street: string;
  /** Kapı numarası. */
  houseNumber: string;
  /** Bina, işyeri ya da tesis adı. */
  building: string;
  /** Posta kodu. */
  postcode: string;
}

/** Aranan ya da haritadan seçilen tek bir yer. */
export interface GeocodePlace {
  /** Listede satır anahtarı olarak kullanılır. */
  id: string;
  /** Nominatim'in kendi ürettiği tek satırlık adres. */
  displayName: string;
  /** Türkiye adres düzenine göre kurulmuş tek satırlık adres. */
  formatted: string;
  latitude: number;
  longitude: number;
  /** OSM sınıfı: 'highway', 'building', 'place' gibi. */
  category: string;
  /** OSM türü: 'residential', 'house', 'suburb' gibi. */
  type: string;
  address: GeocodeAddress;
  /** Haritanın yaslanacağı kutu: [batı, güney, doğu, kuzey]. Yoksa verilmez. */
  bounds?: [number, number, number, number];
}

/** Adres alanlarına bölünmüş arama. Serbest metinden daha isabetli sonuç verir. */
export interface GeocodeQuery {
  /** Cadde/sokak, istenirse kapı numarasıyla: 'Moda Caddesi 12'. */
  street?: string;
  /** İlçe ya da şehir. */
  district?: string;
  /** İl. */
  province?: string;
  /** Posta kodu. */
  postcode?: string;
}

/** Nominatim'in döndürdüğü ham kayıt. Yalnızca kullanılan alanlar yazıldı. */
interface NominatimPlace {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  class?: string;
  type?: string;
  boundingbox?: string[];
  address?: Record<string, string>;
  error?: string;
}

/** İlk dolu değeri döndürür; hiçbiri yoksa boş string. */
function pick(source: Record<string, string> | undefined, ...keys: string[]): string {
  if (!source) {
    return '';
  }

  for (const key of keys) {
    const value = source[key];

    if (value) {
      return value;
    }
  }

  return '';
}

/**
 * OSM adres alanlarını Türkiye adres düzenine eşler.
 *
 * Tek bir alan adına güvenilemiyor: aynı kavram OSM'de yönetim kademesine göre
 * farklı anahtarlarla geliyor. İl çoğu kayıtta `province`, bazılarında `state`;
 * büyükşehirlerde ilçe `county` yerine `town` ya da `city_district` olarak
 * çıkıyor; mahalle ise `neighbourhood`, `quarter` ve `suburb` arasında gidip
 * geliyor. Bu yüzden her alan için sıralı bir aday listesi deneniyor.
 */
function toAddress(source: Record<string, string> | undefined, name: string): GeocodeAddress {
  return {
    province: pick(source, 'province', 'state', 'region'),
    district: pick(source, 'county', 'city_district', 'district', 'town', 'municipality', 'city'),
    neighbourhood: pick(source, 'neighbourhood', 'quarter', 'suburb', 'village', 'hamlet'),
    street: pick(source, 'road', 'pedestrian', 'footway', 'residential', 'path'),
    houseNumber: pick(source, 'house_number'),
    building: pick(source, 'building', 'amenity', 'shop', 'office', 'leisure', 'tourism') || name,
    postcode: pick(source, 'postcode'),
  };
}

/**
 * Adresi Türkiye'de yazıldığı sırayla tek satıra dizer:
 *
 *   Caferağa Mah. Moda Cad. No:12, 34710 Kadıköy/İstanbul
 *
 * Nominatim'in kendi `display_name`'i ülkeyi ve ara kademeleri de yazıp ters
 * sırayla diziyor; ekranda okunması zor. Ham hali yine de `displayName`
 * alanında duruyor, gerektiğinde ona bakılabilir.
 */
function format(address: GeocodeAddress): string {
  const line: string[] = [];

  if (address.neighbourhood) {
    line.push(address.neighbourhood);
  }

  if (address.street) {
    line.push(address.street);
  }

  if (address.houseNumber) {
    line.push(`No:${address.houseNumber}`);
  }

  // Bina adı yalnızca sokak bilgisi yoksa yazılıyor; ikisi birden olunca satır
  // 'Moda Cad. No:12 Akmerkez' gibi tuhaf okunuyordu.
  if (!address.street && address.building) {
    line.push(address.building);
  }

  const parts: string[] = [];

  if (line.length) {
    parts.push(line.join(' '));
  }

  const place = [address.district, address.province].filter(Boolean).join('/');

  if (place) {
    parts.push(address.postcode ? `${address.postcode} ${place}` : place);
  }

  return parts.join(', ');
}

/** Ham kaydı ekranların kullandığı biçime çevirir. */
function toPlace(raw: NominatimPlace): GeocodePlace {
  const address = toAddress(raw.address, raw.name ?? '');
  const box = raw.boundingbox;

  return {
    id: String(raw.place_id ?? `${raw.osm_type ?? ''}${raw.osm_id ?? ''}`),
    displayName: raw.display_name ?? '',
    formatted: format(address) || raw.display_name || '',
    latitude: Number(raw.lat ?? 0),
    longitude: Number(raw.lon ?? 0),
    category: raw.class ?? '',
    type: raw.type ?? '',
    address,
    // Nominatim kutuyu [güney, kuzey, batı, doğu] sırasıyla ve metin olarak
    // veriyor; harita kitaplıkları [batı, güney, doğu, kuzey] bekliyor.
    bounds: box && box.length === 4 ? [Number(box[2]), Number(box[0]), Number(box[3]), Number(box[1])] : undefined,
  };
}

/**
 * Adres arama ve ters geokodlama servisi.
 *
 * Arkasında kurum içine kurulmuş bir Nominatim çalışır; internet gerekmez.
 * Backend'in üretilen servisleriyle aynı sözleşmeyi izler: kök adresi ortam
 * dosyasından okur, uç noktanın yolunu kendi içinde tutar, ekranlar adres
 * kurmaz.
 *
 * İstekler GeocodeInterceptor'dan geçer; oturum token'ı eklenmez.
 *
 * Ortam dosyasında adres tanımlı değilse servis kapalıdır: istek atmak yerine
 * boş sonuç döner. Böylece adres sunucusu olmayan bir ortamda ekranlar hata
 * yağmuru yerine 'servis tanımlı değil' durumunu gösterebiliyor.
 */
@Injectable({
  providedIn: 'root',
})
export class GeocodeService {
  private readonly http = inject(HttpClient);

  /** Ortam dosyasında adres sunucusu tanımlı mı. */
  public readonly enabled = GEOCODE_BASE_PATH.length > 0;

  /**
   * Bütün isteklere eklenen ortak parametreler.
   *
   * `countrycodes` aramayı Türkiye ile sınırlar: kurulum yalnızca Türkiye
   * verisiyle yapıldığı için sınır dışı sonuç zaten az çıkar, ama sınıra yakın
   * yerlerde komşu ülkenin kaydı geliyordu. `accept-language` sonucun Türkçe
   * yazımını getirir, `addressdetails` de parçalara ayrılmış adresi.
   */
  private readonly common = {
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'tr',
    'accept-language': 'tr',
  };

  /**
   * Serbest metinle adres arar.
   *
   * Kullanıcının yazdığı her şey kabul edilir: 'Moda Caddesi 12 Kadıköy',
   * 'Ankara Kızılay', bir işyeri adı ya da posta kodu.
   */
  public search(query: string, limit = 8): Observable<GeocodePlace[]> {
    const text = query.trim();

    if (!this.enabled || !text) {
      return of([]);
    }

    const params = { ...this.common, q: text, limit: String(limit) };

    return this.http
      .get<NominatimPlace[]>(`${GEOCODE_BASE_PATH}search`, { params })
      .pipe(map((response) => (response ?? []).map(toPlace)));
  }

  /**
   * Adres alanlarına bölünmüş arama.
   *
   * Serbest metinde sıralama yanlış olduğunda ('Kadıköy Moda Caddesi' yerine
   * 'Moda Caddesi Kadıköy') Nominatim sonucu kaçırabiliyor. Alanlar ayrı
   * verildiğinde bu belirsizlik kalmıyor; kayıtlı adres formundan gelen veri
   * için bu yol tercih edilmeli.
   */
  public searchStructured(query: GeocodeQuery, limit = 8): Observable<GeocodePlace[]> {
    const params: Record<string, string> = { ...this.common, limit: String(limit) };

    if (query.street) {
      params['street'] = query.street.trim();
    }

    if (query.district) {
      params['city'] = query.district.trim();
    }

    if (query.province) {
      params['state'] = query.province.trim();
    }

    if (query.postcode) {
      params['postalcode'] = query.postcode.trim();
    }

    // Hiçbir alan dolmadıysa istek bütün Türkiye'yi taramaya dönüşürdü.
    const filled = ['street', 'city', 'state', 'postalcode'].some((key) => params[key]);

    if (!this.enabled || !filled) {
      return of([]);
    }

    return this.http
      .get<NominatimPlace[]>(`${GEOCODE_BASE_PATH}search`, { params })
      .pipe(map((response) => (response ?? []).map(toPlace)));
  }

  /**
   * Bir koordinatın adresini bulur.
   *
   * `zoom` sonucun ayrıntı kademesidir: 18 bina, 16 sokak, 14 mahalle, 10 ilçe
   * karşılığı. Varsayılan 18, yani elde olan en ince adres.
   *
   * Nominatim adres bulamadığında 200 ile `{ error: ... }` döndürüyor; bu
   * durumda null dönülüyor, çağıran tarafta ayrıca hata yakalamak gerekmesin.
   */
  public reverse(latitude: number, longitude: number, zoom = 18): Observable<GeocodePlace | null> {
    if (!this.enabled) {
      return of(null);
    }

    const params = {
      ...this.common,
      lat: String(latitude),
      lon: String(longitude),
      zoom: String(zoom),
    };

    return this.http
      .get<NominatimPlace>(`${GEOCODE_BASE_PATH}reverse`, { params })
      .pipe(map((response) => (!response || response.error ? null : toPlace(response))));
  }
}
