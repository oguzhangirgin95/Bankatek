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
| `/analytics/transfertrend/start` | Transfer Analizi | Günlük trend ve kanal dağılımı |
| `/reports/reportlist/start` | Raporlar | Oluşturulmuş raporlar |
| `/reports/reportentry/start` | Rapor Girişi | Kapsam seçimi → onay → sonuç |
| `/settings/preferences/start` | Ayarlar | Dil, sayfa boyutu, varsayılan şehir, yenileme |
| `/storybook/showcase/start` | Bileşenler | Ortak bileşenlerin canlı vitrini |

## Yapı

```
frontend/src/
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

Ekranlar veriye `lib/services/api/*Controller.service.ts` üzerinden erişir.
Bu servisler gerçek bir OpenAPI istemcisi gibi HTTP isteği atar.

## Veri katmanı

İstekler ağa çıkmadan `lib/base/baseinterceptor/mockinterceptor.ts` tarafından
karşılanır. Uçlar `lib/mock/mockapi.ts` içinde, veri `lib/mock/mockdata.ts`
içinde üretilir:

- 14 şehir, şehir başına 3 şube (Ankara'da 6)
- 276 müşteri: müşteri no, segment, kredi notu, durum, günlük transfer limiti
- Müşteri başına bir hesap: IBAN, ürün, para birimi, bakiye
- ~1.500 transfer: Havale / EFT / FAST / SWIFT / Otomatik Ödeme
- Menü, ekran metinleri, raporlar ve kullanıcı ayarları

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
| `unityUrl` | Panodaki 3B harita çıktısının adresi |
| `keycloakUrl` | Boş bırakılırsa oturum açma atlanır (demo modu) |
| `weatherUrl` | Vitrindeki hava durumu servisi |

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
