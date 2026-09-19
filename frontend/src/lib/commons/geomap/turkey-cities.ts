/** Bir ilin merkez koordinatı. */
export interface CityLocation {
  latitude: number;
  longitude: number;
}

/**
 * İl plaka kodundan merkez koordinatına.
 *
 * Servis şehir istatistiklerini `x`/`y` ile gönderiyor ama bunlar SVG
 * haritasının görüntü kutusundaki yüzdeler, coğrafi koordinat değil. Sokak
 * haritasına işaret koymak için gerçek enlem/boylam gerekiyor; bu tablo o
 * boşluğu dolduruyor.
 *
 * Aynı mantıkla `lib/commons/map/turkey-map.ts` de il sınırlarının SVG
 * geometrisini tutuyor: konum bilgisi servis sözleşmesinde değil, istemcide
 * duran durağan veri.
 *
 * Koordinatlar il merkezlerinin resmi konumları; 81 ilin tamamı burada,
 * böylece servis hangi ili gönderirse göndersin haritada yeri bulunuyor.
 */
export const TURKEY_CITIES: Record<string, CityLocation> = {
  '01': { latitude: 37.001667, longitude: 35.328889 }, // Adana
  '02': { latitude: 37.764722, longitude: 38.278611 }, // Adıyaman
  '03': { latitude: 38.750278, longitude: 30.556667 }, // Afyonkarahisar
  '04': { latitude: 39.719444, longitude: 43.050556 }, // Ağrı
  '05': { latitude: 40.649722, longitude: 35.835278 }, // Amasya
  '06': { latitude: 39.92077, longitude: 32.85411 }, // Ankara
  '07': { latitude: 36.88414, longitude: 30.70563 }, // Antalya
  '08': { latitude: 41.18222, longitude: 41.81889 }, // Artvin
  '09': { latitude: 37.84444, longitude: 27.84556 }, // Aydın
  '10': { latitude: 39.64861, longitude: 27.8825 }, // Balıkesir
  '11': { latitude: 40.14556, longitude: 29.97917 }, // Bilecik
  '12': { latitude: 38.885, longitude: 40.49861 }, // Bingöl
  '13': { latitude: 38.39528, longitude: 42.12361 }, // Bitlis
  '14': { latitude: 40.73528, longitude: 31.60639 }, // Bolu
  '15': { latitude: 37.72111, longitude: 30.29056 }, // Burdur
  '16': { latitude: 40.18222, longitude: 29.06111 }, // Bursa
  '17': { latitude: 40.15556, longitude: 26.41444 }, // Çanakkale
  '18': { latitude: 40.6, longitude: 33.61667 }, // Çankırı
  '19': { latitude: 40.55056, longitude: 34.95556 }, // Çorum
  '20': { latitude: 37.77639, longitude: 29.08611 }, // Denizli
  '21': { latitude: 37.91417, longitude: 40.23056 }, // Diyarbakır
  '22': { latitude: 41.67083, longitude: 26.55556 }, // Edirne
  '23': { latitude: 38.68056, longitude: 39.22639 }, // Elazığ
  '24': { latitude: 39.75, longitude: 39.5 }, // Erzincan
  '25': { latitude: 39.90861, longitude: 41.27694 }, // Erzurum
  '26': { latitude: 39.77639, longitude: 30.52056 }, // Eskişehir
  '27': { latitude: 37.06667, longitude: 37.38333 }, // Gaziantep
  '28': { latitude: 40.91667, longitude: 38.4 }, // Giresun
  '29': { latitude: 40.45, longitude: 39.48333 }, // Gümüşhane
  '30': { latitude: 37.58333, longitude: 43.73333 }, // Hakkari
  '31': { latitude: 36.2, longitude: 36.16667 }, // Hatay
  '32': { latitude: 37.76667, longitude: 30.55 }, // Isparta
  '33': { latitude: 36.8, longitude: 34.63333 }, // Mersin
  '34': { latitude: 41.01384, longitude: 28.94966 }, // İstanbul
  '35': { latitude: 38.41885, longitude: 27.12872 }, // İzmir
  '36': { latitude: 40.60833, longitude: 43.08333 }, // Kars
  '37': { latitude: 41.38889, longitude: 33.78222 }, // Kastamonu
  '38': { latitude: 38.73111, longitude: 35.47889 }, // Kayseri
  '39': { latitude: 41.73333, longitude: 27.21667 }, // Kırklareli
  '40': { latitude: 39.14222, longitude: 34.17056 }, // Kırşehir
  '41': { latitude: 40.76667, longitude: 29.91667 }, // Kocaeli
  '42': { latitude: 37.86667, longitude: 32.48333 }, // Konya
  '43': { latitude: 39.41667, longitude: 29.98333 }, // Kütahya
  '44': { latitude: 38.355, longitude: 38.305 }, // Malatya
  '45': { latitude: 38.61361, longitude: 27.42694 }, // Manisa
  '46': { latitude: 37.58333, longitude: 36.93333 }, // Kahramanmaraş
  '47': { latitude: 37.31111, longitude: 40.74361 }, // Mardin
  '48': { latitude: 37.21667, longitude: 28.36667 }, // Muğla
  '49': { latitude: 38.74444, longitude: 41.49611 }, // Muş
  '50': { latitude: 38.62444, longitude: 34.72306 }, // Nevşehir
  '51': { latitude: 37.96667, longitude: 34.68333 }, // Niğde
  '52': { latitude: 40.98333, longitude: 37.88333 }, // Ordu
  '53': { latitude: 41.02083, longitude: 40.52361 }, // Rize
  '54': { latitude: 40.76667, longitude: 30.41667 }, // Sakarya
  '55': { latitude: 41.28639, longitude: 36.33139 }, // Samsun
  '56': { latitude: 37.94444, longitude: 41.93333 }, // Siirt
  '57': { latitude: 42.02361, longitude: 35.15306 }, // Sinop
  '58': { latitude: 39.74722, longitude: 37.0175 }, // Sivas
  '59': { latitude: 40.98333, longitude: 27.51667 }, // Tekirdağ
  '60': { latitude: 40.31667, longitude: 36.55 }, // Tokat
  '61': { latitude: 41, longitude: 39.73333 }, // Trabzon
  '62': { latitude: 39.11667, longitude: 39.53333 }, // Tunceli
  '63': { latitude: 37.15, longitude: 38.8 }, // Şanlıurfa
  '64': { latitude: 38.68333, longitude: 29.41667 }, // Uşak
  '65': { latitude: 38.5, longitude: 43.4 }, // Van
  '66': { latitude: 39.81667, longitude: 34.81667 }, // Yozgat
  '67': { latitude: 41.45, longitude: 31.8 }, // Zonguldak
  '68': { latitude: 38.36667, longitude: 34.03333 }, // Aksaray
  '69': { latitude: 40.25, longitude: 40.21667 }, // Bayburt
  '70': { latitude: 37.18333, longitude: 33.21667 }, // Karaman
  '71': { latitude: 39.85, longitude: 33.51667 }, // Kırıkkale
  '72': { latitude: 37.88333, longitude: 41.13333 }, // Batman
  '73': { latitude: 37.51667, longitude: 42.46667 }, // Şırnak
  '74': { latitude: 41.63333, longitude: 32.33333 }, // Bartın
  '75': { latitude: 41.10833, longitude: 42.7 }, // Ardahan
  '76': { latitude: 39.91667, longitude: 44.03333 }, // Iğdır
  '77': { latitude: 40.65, longitude: 29.26667 }, // Yalova
  '78': { latitude: 41.2, longitude: 32.63333 }, // Karabük
  '79': { latitude: 36.71667, longitude: 37.11667 }, // Kilis
  '80': { latitude: 37.06667, longitude: 36.25 }, // Osmaniye
  '81': { latitude: 40.83333, longitude: 31.16667 }, // Düzce
};
