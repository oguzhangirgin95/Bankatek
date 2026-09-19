# Bankatek

Bankacılık izleme ve işlem paneli. Müşteri portföyünün şehir ve şube bazında
takibi, hesap envanteri, transfer işlemleri, şube yoğunluğu ve raporlama tek bir
Angular uygulamasında toplanır.

Proje **yalnızca ön yüzden** oluşur. Veri, uygulamanın içindeki deterministik
bir mock katmanından gelir; ayrı bir sunucu ya da veritabanı kurmadan
`npm start` ile çalışır.

## Hızlı başlangıç

```bash
cd frontend
npm install
npm start           # http://localhost:4200
```

Üretim derlemesi ve SSR sunucusu:

```bash
npm run build
node dist/frontend/server/server.mjs    # http://localhost:4000
```

Testler:

```bash
npm test
```

## Ekranlar

| Adres | Ekran | İçerik |
| --- | --- | --- |
| `/monitoring/dashboard/start` | Pano | Özet kartları, Türkiye haritası, durum dağılımı, şube yoğunluğu |
| `/customers/customerlist/start` | Müşteri Listesi | Filtre, arama, sayfalama; detayda kişi / hesap / transfer sekmeleri |
| `/accounts/accountlist/start` | Hesap Listesi | IBAN, ürün, bakiye, tip dağılımı |
| `/transfers/transferlist/start` | Transfer Takibi | Tip ve duruma göre filtre, tutar, alıcı |
| `/transfers/transfercreate/start` | Transfer Oluştur | Üç adımlı akış: form → onay → sonuç |
| `/branches/branchlist/start` | Şube Yoğunluğu | Şube bazında kanal kırılımı ve yoğunluk yüzdesi |
| `/regions/regionlist/start` | Şehir Bazlı Dağılım | Harita ve şehir tablosu |
| `/regions/addresssearch/start` | Adres Arama | Sokak seviyesinde harita, adres arama ve koordinat |
| `/analytics/transfertrend/start` | Transfer Analizi | Günlük trend ve kanal dağılımı |
| `/reports/reportlist/start` | Raporlar | Oluşturulmuş raporlar |
| `/reports/reportentry/start` | Rapor Girişi | Kapsam seçimi → onay → sonuç |
| `/settings/preferences/start` | Ayarlar | Dil, sayfa boyutu, varsayılan şehir, yenileme |
| `/storybook/showcase/start` | Bileşenler | Ortak bileşenlerin canlı vitrini |

## Yapı

```
frontend/src/
  app/modules/<modül>/<modül>.config.ts       modül menüsü
  app/modules/<modül>/transactions/<ekran>/   ekranlar (config, routes, start)
  lib/base/                                    akış, doğrulama, interceptor, guard
  lib/commons/                                 ortak bileşenler (grid, chart, modal, ...)
  lib/services/                                API istemcisi ve model tipleri
  lib/mock/                                    veri kaynağı
  environments/                                ortam dosyaları
```

Her ekran bir **transaction**: `<ekran>.config.ts` adımları, doğrulamaları ve
butonları tanımlar, `<ekran>.routes.ts` adımları route'a bağlar,
`<ekran>.start.ts` ilk adımın bileşenidir. Çok adımlı akışlarda onay ve sonuç
adımları `lib/base/basecomponent/commonconfirm|commonexecute` bileşenlerini
kullanır; ekran başına ayrı bileşen yazılmaz.

### Adım şeridi

Çok adımlı akışlarda gövdenin üstünde bir adım şeridi (`lib/commons/step`)
çizilir: hangi adımların olduğunu ve hangisinde bulunulduğunu akış
yapılandırmasından okur, dolayısıyla ekranda hiçbir şey yazmak gerekmez. Adım
başlığı `FlowStep.title` alanından gelir ve doğrulama mesajlarındaki gibi
`ANAHTAR | varsayılan metin` biçimini destekler; verilmezse şerit sıra
numarasına düşer. Tek adımlı transaction'larda şerit hiç görünmez.

```ts
{ step: 'confirm', title: 'TRANSFERCREATE_STEP_CONFIRM | Onay', validation: [] }
```

Geçilen adımlar tik işareti ve modülün rengiyle işaretlenir, bulunulan adım
doldurulur, sıradakiler soluk kalır. Şerit tıklanabilir değildir: sonuç
adımından geri dönüş yapılandırmada kapatılıyor ve onay adımı açılırken
servisini yeniden çağırıyor, gezinme ileri/geri butonlarında kalır.

Hücreler eşit genişliktedir ve 96px'in altına inmez; sığmadıklarında şerit
sekmelerdeki gibi yana kayar. Uzun bir başlık iki satırda kesilir, tamamı
`title` ile görünür. Ekran okuyucu her adımda sırayı ve hali duyar
("Adım 2, bu adımda"), çünkü tik işareti ve renkler sessizdir.

Ekranlar veriye `lib/services/api/*Controller.service.ts` üzerinden erişir.
Bu servisler gerçek bir OpenAPI istemcisi gibi HTTP isteği atar.

### Liste ve sayfalama

`lib/commons/genericlist` sayfalama şeridini kendi içinde taşır: `pageSize`
verildiğinde tablonun altına kendiliğinden çizilir, ekranın ayrıca
`app-pagination` yerleştirmesi gerekmez. Hangi türlü çalıştığını `totalCount`
belirler:

```html
<!-- Sunucu sayfalıyor: liste eline geleni çizer, sayfa değişimini bildirir -->
<app-genericlist
  [config]="listConfig"
  [rows]="State.CustomerList ?? []"
  [totalCount]="State.TotalCount ?? 0"
  [pageSize]="State.Request.pageSize"
  [pageNumber]="State.Request.pageNumber"
  (pageNumberChange)="setPage($event)"
/>

<!-- Veri zaten bellekte: liste satırları kendi böler -->
<app-genericlist [config]="listConfig" [rows]="rows" [pageSize]="10" />
```

`totalCount` verilmediğinde liste elindeki satırları kendi dilimler, yani
küçük listeler için ekranın dilimleme kodu yazmasına gerek kalmaz. Filtre
daralıp satır sayısı azaldığında açık sayfa listenin dışında kalabiliyor; boş
sayfa göstermek yerine son sayfaya çekilir.

### Dosya yükleme

`lib/commons/fileupload`, PDF, Excel, Word ve görsel gibi dosyaların
seçilebildiği alandır. Dosyalar sürüklenip bırakılarak ya da alana tıklanıp
seçilerek eklenir; tür, boyut, adet ve tekrar denetimini geçemeyenler listeye
girmez ve sebebiyle birlikte altta yazılır.

Input ve Select gibi `ControlValueAccessor` uygular, yani ngModel ile bağlanır
ve yapılandırmadaki `Required` kuralı boş listeyi yakalar:

```html
<app-fileupload id="documents" label="Belgeler" accept=".pdf,.xlsx" [maxSize]="10" [(ngModel)]="State.Request.documents" />
```

| Girdi | Varsayılan | Anlamı |
| --- | --- | --- |
| `accept` | `.pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg` | Kabul edilen uzantılar |
| `multiple` | `true` | Birden çok dosya seçilebilir mi |
| `maxSize` | `10` | Dosya başına üst sınır, MB |
| `maxCount` | `5` | En fazla kaç dosya; `0` sınırsız |

Değer `UploadFile[]`'dır ve her kaydın içinde tarayıcıdan gelen asıl `File`
nesnesi durur. Dosyaları sunucuya göndermek bileşenin işi değildir: hangi uca,
hangi gövdeyle gideceğine ekran karar verir — diğer ekranların servis
çağrılarını kendi yapması gibi.

### Üst şerit

Üst şeritte oturum açıkken iki bileşen daha durur.

**Bildirimler** (`lib/commons/notification`): zil, okunmamış sayısını rozetle
gösterir; panel açıldığında kayıtlar listelenir. İçerik uydurma değil,
ekranlardaki veriden beslenir — bekleyen bir transfer, limitini aşan bir
müşteri, oluşturulmuş bir rapor. Bir bildirime tıklamak onu okundu işaretler
ve tanımlıysa ilgili ekrana götürür, yani bildirim bir bilgi değil kısayoldur.
Okundu işaretleme oturum boyunca kalıcıdır (`/notification/read`).

**Bilgilendirme** (`lib/commons/learning`): soru işareti, sağdan açılan bir
panelde bulunulan ekranın tanıtım turunu durak durak listeler. Bir durağa
tıklamak turu o duraktan başlatır; tur daha önce görülmüş ya da kapatılmış
olsa bile açılır, çünkü kullanıcı bunu açıkça istemiştir. Ekranın turu yoksa
panel bunu söyler. "İpuçlarını yeniden aç" bütün ekranlarda gizlenmiş turları
geri getirir.

### Tanıtım turu

Tur, ekranın `<ekran>.config.ts` dosyasındaki `tour` dizisinden gelir. Her
durak bir `id` ile ekrandaki elemanı bulur, başlık ve metin
`ANAHTAR|varsayılan metin` biçimini destekler:

```ts
tour: [
  {
    id: 'receiverIban',
    title: 'TOUR_TRANSFERCREATE_IBAN_TITLE|IBAN doğrulanır',
    text: 'TOUR_TRANSFERCREATE_IBAN_TEXT|TR ile başlayan 26 karakter beklenir.',
  },
]
```

`id` ekranda gerçekten bulunmalı; bulunamayan hedefte durak sekiz saniye
bekleyip atlanır. Turu olan ekranlar: Pano, Transfer Oluştur, Transfer Takibi,
Müşteri Listesi, Rapor Girişi ve Bileşenler. Tur ilk girişte kendiliğinden
açılır, bir kez görüldükten sonra yalnızca bilgilendirme panelinden çağrılır.

## Modül yapılandırması

Her modülün bir `<modül>.config.ts` dosyası vardır: altındaki transaction'ları,
modülün rengini ve arka plan animasyonunu taşır. `<modül>.routes.ts` bu
yapılandırmayı transaction route'una `moduleConfig` anahtarıyla bağlar;
`FlowService` route ağacında yukarı doğru arayıp bulur.

```ts
export const TransfersConfig: ModuleConfig = {
  code: 'MENU_TRANSFERS',
  title: 'Transferler',
  color: '#f59e0b',
  background: '/assets/modules/olay.svg',
  transactions: [
    { code: 'MENU_TRANSFERLIST', title: 'Transfer Takibi', path: '/transfers/transferlist/start' },
    { code: 'MENU_TRANSFERCREATE', title: 'Transfer Oluştur', path: '/transfers/transfercreate/start' },
  ],
};
```

### Menü

Menü ekrana göre değişir: `transfers` altındaki bir transaction açıkken menüde
transfers modülünün bütün ekranları, `customers` altındaki bir transaction
açıkken customers modülünün ekranları listelenir. Başlıklar `code` ile
çevrilir, karşılığı yoksa `title` gösterilir; `isEnable` verilirse bağlantı
yalnızca o özellik bayrağı açıkken menüde yer alır.

Panelin altındaki modül listesi bunun dışındadır: sunucudan (`/menu/list`)
gelir ve modüller arası geçişi sağlar, yani kullanıcının yetkisi neyse menüde
o modüller görünür.

### Renk

`color`, `App` bileşeni üzerinden `--color-module` değişkenine yazılır. Üst
şeridin çizgisi, menüdeki açık ekran işareti, panel başlığı ve arka plan
parıltısı bu değişkeni okur. Seçili tema zemini belirlemeye devam eder; modül
rengi yalnızca hangi modülde olunduğunu ayırt eder.

### Arka plan

`background`, `src/assets/modules/` altındaki hareketli bir SVG'yi gösterir.
Animasyon dosyanın kendisindedir (SMIL); kod tarafında animasyon yoktur. Görsel
`App` şablonundaki `.app-backdrop` katmanında tam ekran çizilir, tıklamayı
geçirir ve içeriğin altında kalır. `prefers-reduced-motion` açıkken görsel
düşer, modülün rengi kalır.

Görsel dil Keycloak giriş temasındaki arka planlarla aynı: koyu zemin üzerinde
ince açık mavi teknik çizgiler, braket köşeli paneller, cetvel taksimatı,
odak dışı ışık lekeleri ve modülün renginde vurgu eğrileri. Arka planda **yazı
yoktur** — etiketlerin yerini, ekranın kendi metniyle yarışmayan ince veri
çizgileri alır.

Dosyadaki vurgu rengi yapılandırmadaki `color` ile aynıdır; SVG bir arka plan
görseli olarak yüklendiği için sayfanın CSS değişkenlerini okuyamaz.

| Modül | Renk | Arka plan | Sahne |
| --- | --- | --- | --- |
| `monitoring` | `#22d3ee` | `veri.svg` | Radar kadranı, tarama huzmesi, dalga formu |
| `customers` | `#a78bfa` | `kopek.svg` | Büyük Köpek takımyıldızı, gök koordinat ağı |
| `accounts` | `#34d399` | `hesap.svg` | İki hesap paneli, arada bakiye aktarımı |
| `transfers` | `#f59e0b` | `olay.svg` | Uçlar arası olay hattı, ilerleyen paketler |
| `regions` | `#60a5fa` | `harita.svg` | Eş yükselti eğrileri, ölçüm noktaları |
| `branches` | `#f472b6` | `ag.svg` | Şube düğümleri, merkezden yayılan sinyal |
| `reports` | `#f87171` | `rapor.svg` | Rapor sayfası, dağılım sütunları |
| `analytics` | `#a3e635` | `kimyasal.svg` | Benzen halkası, elektron yörüngeleri |
| `settings` | `#818cf8` | `devre.svg` | Baskı devre, yollarda ilerleyen akım |
| `storybook` | `#e879f9` | `egitim.svg` | Açı ölçer, çizilen yay, teknik resim |

## Veri katmanı

İstekler ağa çıkmadan `lib/base/baseinterceptor/mockinterceptor.ts` tarafından
karşılanır. Uçlar `lib/mock/mockapi.ts` içinde, veri `lib/mock/mockdata.ts`
içinde üretilir:

- 14 şehir, şehir başına 3 şube (Ankara'da 6)
- 276 müşteri: müşteri no, segment, kredi notu, durum, günlük transfer limiti
- Müşteri başına bir hesap: IBAN, ürün, para birimi, bakiye
- ~1.500 transfer: Havale / EFT / FAST / SWIFT / Otomatik Ödeme
- Menü, ekran metinleri, raporlar ve kullanıcı ayarları
- 14 bildirim: transfer, limit, rapor ve sistem duyurusu; ilk beşi okunmamış

Üretim deterministiktir: aynı kayıt her açılışta aynı değerleri alır. Transfer
oluşturma ve rapor girişi akışları veriyi oturum boyunca gerçekten günceller.

Arkasına gerçek bir servis takmak isterseniz `MockInterceptor`'ı
`app.config.ts` içindeki listeden çıkarmanız ve `apiUrl` ortam değerini o
servise yöneltmeniz yeterli; ekranlarda ve servis imzalarında değişiklik
gerekmez.

## Ortam dosyaları

`frontend/src/environments/*.env` ortam başına değer taşır; `local`,
`development`, `test`, `uat`, `preprod` ve `prod` yapılandırmaları vardır.

| Anahtar | Açıklama |
| --- | --- |
| `apiUrl` | İstek öneki; mock katmanı bu önekle gelen istekleri karşılar |
| `defaultLanguage` | Varsayılan dil |
| `cryptoKey` | İstemci tarafı şifreleme anahtarı (32 karakter) |
| `unityUrl` | Unity WebGL çıktısının adresi; yalnızca bileşen vitrininde |
| `mapTilesUrl` | Vektör karo arşivi; boş bırakılırsa sokak haritası kapanır |
| `mapGlyphsUrl` | Harita etiketlerinin yazı tipi adresi |
| `mapSpriteUrl` | Harita ikon atlası; kullanılmıyor, boş kalmalı |
| `geocodeUrl` | Adres arama sunucusu; boş bırakılırsa adres özellikleri kapanır |
| `keycloakUrl` | Boş bırakılırsa oturum açma atlanır (demo modu) |
| `weatherUrl` | Vitrindeki hava durumu servisi |

## Harita

İki ayrı harita var. `lib/commons/map` elle çizilmiş bir SVG'dir, illeri
değerlerine göre boyar ve hiçbir kuruluma ihtiyaç duymaz. `lib/commons/geomap`
ise sokak seviyesinde gerçek haritadır: MapLibre GL JS, kurum içinden servis
edilen vektör karo arşivi ve adres için Nominatim. Tamamı çevrimdışı çalışır,
internete çıkmaz.

Panodaki şehir haritası da `geomap` kullanır: iller merkez koordinatlarına
işaretlenir, işarete tıklamak panoyu o şehre filtreler. Servis şehir
istatistiklerini SVG kutusuna ait `x`/`y` ile gönderdiği için gerçek
koordinatlar `lib/commons/geomap/turkey-cities.ts` içinde durur — 81 ilin
merkezi.

Sokak haritası **isteğe bağlıdır**: `mapTilesUrl` boşken harita yerine bilgi
metni çıkar, `geocodeUrl` boşken adres arama kapanır, uygulamanın geri kalanı
etkilenmez. Veri üretimi ve servislerin kurulumu `maps/README.md` içinde.

## Oturum

`keycloakUrl` boşken uygulama demo kullanıcısıyla açılır. Keycloak kullanmak
için bu değeri doldurun; giriş teması ve realm kurulumu `keycloak/README.md`
içinde anlatılıyor.

## Dağıtım

`frontend/Dockerfile` SSR sunucusunu üreten iki aşamalı bir imaj kurar;
`render.yaml` tek bir web servisi tanımlar. Ortam değerleri derleme sırasında
`FE_*` build arg'larından `prod.env` dosyasına yazılır.

```bash
docker build -t bankatek ./frontend \
  --build-arg FE_API_URL=/api \
  --build-arg FE_DEFAULT_LANGUAGE=tr \
  --build-arg FE_CRYPTO_KEY=BankatekProdKey0123456789ABCDEF!!! \
  --build-arg FE_UNITY_URL=/unity/ \
  --build-arg FE_WEATHER_URL=https://api.open-meteo.com/
```
