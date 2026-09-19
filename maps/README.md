# Harita

Sokak seviyesinde Türkiye haritası, adres arama ve ters geokodlama. Tamamı
kurum içinde çalışır; uygulama harita için internete hiç çıkmaz.

İki servis var:

| Servis | Ne yapar | Adres |
| --- | --- | --- |
| `tiles` | Vektör karo arşivini ve yazı tiplerini verir | `http://localhost:8088` |
| `nominatim` | Adres arama (`/search`) ve ters geokodlama (`/reverse`) | `http://localhost:8080` |

Harita **isteğe bağlıdır**: ortam dosyasındaki `mapTilesUrl` boş bırakılırsa
harita yerine bilgi metni çıkar, `geocodeUrl` boş bırakılırsa adres arama
kapanır ve uygulamanın geri kalanı etkilenmez. Şehir bazlı SVG haritası
(`/regions/regionlist/start`) buradaki kurulumdan bağımsızdır, o hep çalışır.

**Depoda harita verisi yok.** Karo arşivi ve OSM çıkarımı gigabaytlarla ölçülür;
`.maps/` klasöründe durur ve git'e girmez. Veri, aşağıdaki betikle internete
çıkabilen bir makinede bir kez üretilip kapalı ağa taşınır.

## Neden bu araçlar

**MapLibre GL JS** — API anahtarı, kullanım kotası ve lisans sözleşmesi yok.
Google ve Yandex haritaları hem çevrimiçi hem de karo kopyalamayı yasaklıyor;
kapalı ağ için baştan eleniyorlar.

**Vektör karo, raster değil** — Türkiye'nin tamamı için z0–19 raster karo yüz
gigabaytlarla ölçülür. Vektör karo z14'e kadar üretilir, üstünü istemci büyütür:
sokak ve bina geometrisi vektör olduğu için 20. kademede de net kalır. Aynı
ayrıntı için disk ihtiyacı yaklaşık yüzde biri.

**PMTiles** — tek dosyalık arşiv. İstemci ihtiyacı olan baytı HTTP Range
isteğiyle çeker; arkada karo sunucusu yazılımı çalıştırmak gerekmez, düz bir
dosya sunucusu yeter.

**Nominatim** — OSM'in kendi geokodlayıcısı. Hem adresten koordinat hem
koordinattan adres verir; aynı OSM çıkarımından beslenir.

## Gereksinimler

| | Ne için | Not |
| --- | --- | --- |
| JDK 21+ | Planetiler | Yalnızca üretim makinesinde |
| Docker | Nominatim | Karolar için şart değil; `serve.mjs` aynı işi görür |
| ~8 GB boş alan | Üretim | `-CompressTemp` ile ~4 GB'a iniyor |
| ~80 GB boş alan | Nominatim | İçe aktarma sonrası veritabanı |
| 8+ GB RAM | Planetiler ve içe aktarma | Daha azıyla da olur, yavaşlar |

Üretimde ölçülen değerler (16 çekirdek, 16 GB RAM, Türkiye'nin tamamı):

| | |
| --- | --- |
| Süre | ~4 dakika |
| Çıktı (`turkey.pmtiles`) | 808 MB |
| Yazı tipleri | 68 MB |
| İndirilen kaynaklar | 1,35 GB (üretimden sonra silinebilir) |
| OSM çıkarımı | 617 MB (Nominatim de kullanır, kalmalı) |

Asıl disk yükü geçici dosyalarda: sıkıştırma olmadan `sort` aşaması tek başına
3 GB'ı aşıyor. Dar diskte `-CompressTemp` şart, CPU'dan biraz götürüyor.

## 1. Veriyi üret (internetli makinede, bir kez)

```powershell
.\maps\setup.ps1
```

Betik `.maps/` altına şunları koyar:

```
.maps/
  turkey-latest.osm.pbf     OSM ham verisi (~1 GB) - Nominatim de bunu kullanır
  planetiler.jar            karo üreticisi
  tiles/
    turkey.pmtiles          vektör karo arşivi
    fonts/                  Noto Sans Regular ve Bold
```

Var olan dosya tekrar indirilmez, tekrar üretilmez; baştan üretmek için
`-Force`. Bellek sınırı için `-MemoryGb 4`.

Dar diskli makineler için iki seçenek var:

```powershell
.\maps\setup.ps1 -CompressTemp                        # geçici dosyaları sıkıştırır
.\maps\setup.ps1 -Bounds '26.0,39.8,31.0,41.6'        # yalnız Marmara'yı işler
```

`-Bounds` verildiğinde OSM çıkarımı yine Türkiye'nin tamamı olarak iner ama
sadece o kutu işlenir; Marmara için üretim bir dakikada bitiyor ve çıktı 133 MB
oluyor. Kutunun dışında kalan yerlerde harita boş kalır. Betik başlamadan önce
boş alana bakar ve yetmiyorsa hiç başlamaz; eşik `-RequiredGb` ile değiştirilir.

Kapalı ağa `.maps/tiles` klasörü ile `.maps/turkey-latest.osm.pbf` taşınır.
Docker imajları da orada olmayacağı için:

```powershell
docker pull nginx:alpine
docker pull mediagis/nominatim:5.3
docker save nginx:alpine mediagis/nominatim:5.3 -o .maps/images.tar
# kapalı ağdaki makinede
docker load -i images.tar
```

## 2. Servisleri başlat

```bash
docker compose -f maps/docker-compose.yml up -d
```

**Docker yoksa** karo sunucusu için Node yeter; adres servisi olmadan harita
yine de tam çalışır:

```bash
node maps/serve.mjs          # .maps/tiles klasörünü 8088'de açar
```

`serve.mjs` nginx ile aynı üç şeyi yapar (Range, CORS, sıkıştırma yok) ama tek
süreçtir ve günlük tutmaz; geliştirme içindir, dağıtımda nginx kullanılmalı.

Karo sunucusu saniyeler içinde hazır. **Nominatim'in ilk açılışı birkaç saat
sürer**: OSM çıkarımını PostgreSQL'e aktarır. İlerlemesi:

```bash
docker logs -f bankatek-nominatim
```

İçe aktarma adlı birim (volume) içinde kalır; kap silinip yeniden kurulsa da
tekrarlanmaz. Bittiğini anlamak için:

```bash
curl "http://localhost:8080/search?q=Moda+Caddesi+Kadikoy&format=jsonv2&limit=1"
```

## 3. Uygulamayı bağla

Adresler ortam dosyasında (`frontend/src/environments/*.env`):

| Anahtar | Geliştirme | Dağıtım |
| --- | --- | --- |
| `mapTilesUrl` | `http://localhost:8088/turkey.pmtiles` | `/maps/turkey.pmtiles` |
| `mapGlyphsUrl` | `http://localhost:8088/fonts/{fontstack}/{range}.pbf` | `/maps/fonts/{fontstack}/{range}.pbf` |
| `mapSpriteUrl` | boş | boş |
| `geocodeUrl` | `http://localhost:8080/` | `/nominatim/` |

`{fontstack}` ve `{range}` yer tutucudur, MapLibre doldurur; elle
değiştirilmemeli.

`mapSpriteUrl` isteğe bağlı. Haritadaki hiçbir katman ikon kullanmıyor: eksik
bir ikon adı MapLibre'de konsolu doldurup o katmanı boş bırakıyor, etiketler bu
yüzden yalnız metinle çiziliyor. Atlas kurulmadığı sürece boş kalmalı.

Dağıtımda iki servis de uygulamanın önündeki ters vekilin arkasına alınır;
böylece aynı köken altında toplanırlar ve CORS'a hiç gerek kalmaz:

```nginx
location /maps/ {
    proxy_pass http://tiles/;
    # Range istekleri bozulmasın: sıkıştırma kapalı kalmalı.
    gzip off;
}

location /nominatim/ {
    proxy_pass http://nominatim:8080/;
}
```

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `setup.ps1` | Veri üretimi: OSM çıkarımı, Planetiler, yazı tipleri |
| `docker-compose.yml` | İki servis, birimler, içe aktarma ayarları |
| `nginx.conf` | Karo sunucusunun yapılandırması; Range ve CORS notları burada |
| `serve.mjs` | Docker'sız karo sunucusu; bağımlılığı yok, geliştirme için |

Haritanın görünümü depoda değil kodda:
`frontend/src/lib/commons/geomap/geomap.style.ts` stili seçili temanın
renklerinden üretir. Hazır bir stil dosyası indirilmiyor; hazır stiller yazı
tipini ve çoğu zaman karoyu da internetten çekip kapalı ağda sessizce boş harita
bırakıyorlar.

## Adres kalitesi: bilinmesi gereken

OSM'in Türkiye'de **kapı numarası kapsamı eksiktir**. Cadde ve sokak geometrisi
iyi, büyük şehir merkezlerinde bina numarası makul, ilçe ve kırsalda çok zayıf.
Adres ekranı bu yüzden boş alanları gizlemiyor, çizgiyle gösteriyor: hangi
bilginin gelmediği görünsün diye.

Türkiye'de adresin resmî kaynağı **NVİ / Adres Kayıt Sistemi (UAVT)**:
il → ilçe → mahalle → CSBM (cadde-sokak-bulvar-meydan) → bina → bağımsız bölüm.
Bankalar **KPS** yetkili kullanıcısı olduğu için bu veriye erişim yolu genelde
kurumda zaten vardır. KPS doğru adres metnini verir ama koordinat vermez;
koordinat için TKGM/MEGSİS parsel verisi ya da belediye verisi gerekir.

Hukuken doğru adres gerektiğinde iki yol var:

1. **Taban harita OSM'den, adres UAVT'den.** Buradaki kurulum görsel haritayı ve
   ters geokodlamayı verir; adres doğrulama kurum içi UAVT kopyasından yapılır.
2. **Ticari sağlayıcı.** Başarsoft ya da Netcad; Türkiye adres verisi OSM'in
   belirgin şekilde üstünde, kurum içi kurulum ve destek veriyorlar.

UAVT ve TKGM kaynaklı veriler sık sık **EPSG:5253/5254 (TUREF)** ya da ED50 UTM
dilimlerinde gelir. WGS84'e (EPSG:4326) çevrilmeden haritaya basılırsa noktalar
yüzlerce metre kayar.

## Veriyi güncelleme

OSM sürekli değişir. Güncellemek için `setup.ps1 -Force` ile yeni karo üretilip
`.maps/tiles` değiştirilir, Nominatim tarafında ise birim silinip içe aktarma
tekrarlanır. Nominatim'in artımlı güncelleme yolu da var (`REPLICATION_URL` ve
`UPDATE_MODE`) ama internet erişimi ister; kapalı ağda tam yeniden aktarma daha
basit kalıyor.

## Sorun giderme

**Planetiler indirme adımında `PKIX path building failed`.** Java kendi
sertifika deposunu kullanıyor, Windows'unkine bakmıyor; kurumsal ağda TLS
trafiği araya giren bir vekil tarafından yeniden imzalandığı için doğrulama
başarısız oluyor. `setup.ps1` bu yüzden Java'yı
`-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT` ile çağırıyor. Betiği kendi
komutunuzla değiştirirseniz bu seçeneği koruyun.

**Harita çiziliyor ama tek etiket yok.** Yazı tipi adı tutmuyor. Stil
`Noto Sans Regular` ve `Noto Sans Bold` istiyor; `.maps/tiles/fonts` altında
klasör adları birebir bunlar olmalı.

**14. kademeden sonra harita boşalıyor.** Kaynak `maxzoom` değeri kaybolmuş.
Arşiv z14'e kadar üretiliyor, üstü istemcide büyütülüyor; bu satır olmadan
MapLibre 15'ten sonra karo istemeyi bırakıyor (`geomap.style.ts`).

**Arşivin tamamı indiriliyor, sayfa donuyor.** Karo sunucusunda sıkıştırma
açık. nginx sıkıştırılmış içeriğin bir aralığını veremediği için Range desteğini
düşürüyor, istemci de dosyanın tümünü çekiyor. `gzip off` olmalı.

**Konsolda CORS hatası.** Geliştirmede uygulama 4200'de, karolar 8088'de;
tarayıcı bunu çapraz kaynak sayıyor ve `Range` güvenli listede olmadığı için
önce OPTIONS gönderiyor. `nginx.conf` bunu yanıtlıyor — özelleştirilmişse
OPTIONS dalı da korunmalı.

**Üretim `Diskte yeterli yer yok` ile düşüyor.** `sort` aşaması geçici dosyalar
için gigabaytlar istiyor. `-CompressTemp` ekleyin, yetmezse `-Bounds` ile
bölgeyi daraltın. Düşen üretim geriye 16 KB'lık bozuk bir `.pmtiles` bırakır;
betik 1 MB'ın altındaki çıktıyı yok sayıp yeniden üretir, elle silmek gerekmez.

**Nominatim boş sonuç dönüyor.** İçe aktarma bitmemiş olabilir; loglara bakın.
Bittiği halde boşsa aramanın Türkiye ile sınırlandığını hatırlayın
(`countrycodes=tr`), çıkarım da yalnızca Türkiye'yi içeriyor.
