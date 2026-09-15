# Bankatek frontend

Angular 21 (SSR + hydration) uygulaması. Genel anlatım depo kökündeki
`README.md` dosyasında; burada yalnızca günlük komutlar var.

## Geliştirme sunucusu

```bash
npm start
```

`http://localhost:4200` adresinde açılır, kaynak dosyaları değiştikçe yeniden
yüklenir. Veri uygulamanın içindeki mock katmanından geldiği için ayrıca bir
servis çalıştırmanız gerekmez.

## Derleme

```bash
npm run build                             # varsayılan (production)
npm run build:test | :uat | :preprod | :prod
```

Çıktı `dist/` altında toplanır. SSR sunucusunu çalıştırmak için:

```bash
node dist/frontend/server/server.mjs
```

## Testler

```bash
npm test
```

Vitest ile çalışır; spec dosyaları test ettikleri kaynağın yanında durur.

## Ortam seçimi

Her yapılandırma `src/environments/<ortam>.env` dosyasını okur. Yeni bir değer
eklerken hem `.env` dosyalarını hem de `environment*.ts` içindeki karşılığını
güncelleyin.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `src/app/modules` | Ekranlar; modül > transaction > adım |
| `src/lib/base` | Akış servisi, doğrulama, interceptor, guard, temel bileşen |
| `src/lib/commons` | Ortak arayüz bileşenleri |
| `src/lib/services` | API istemcisi ve model tipleri |
| `src/lib/mock` | Ekranları besleyen veri ve uç noktalar |
| `public` | Doğrudan servis edilen dosyalar (kart görselleri, Unity çıktısı) |
