<#
.SYNOPSIS
  Cevrimdisi harita verisini hazirlar: vektor karo arsivi ve yazi tipleri.

.DESCRIPTION
  Bu betik internete cikabilen bir makinede BIR KEZ calistirilir. Uretilen
  '.maps/tiles' klasoru kapali aga tasinir; uygulama orayi okur, disari hic
  cikmaz.

  Uretilenler:
    .maps/turkey-latest.osm.pbf   OSM ham verisi (Nominatim de bunu kullanir)
    .maps/planetiler.jar          karo ureticisi
    .maps/tiles/turkey.pmtiles    vektor karo arsivi
    .maps/tiles/fonts/            etiket yazi tipleri

  Adimlar atlanabilir: var olan dosya tekrar indirilmez, tekrar uretilmez.
  Bastan uretmek icin -Force verin.

.PARAMETER Area
  Geofabrik uzerindeki bolge. Varsayilan Turkiye.

.PARAMETER MemoryGb
  Planetiler'e verilecek bellek. Turkiye icin 8 yeterli; makinede daha az RAM
  varsa dusurun, uretim yavaslar ama calisir.

.PARAMETER RequiredGb
  Uretime baslamadan once aranan bos disk alani. Varsayilan 8: Turkiye icin
  olculen tepe kullanim, indirilen kaynaklarin (~2 GB) uzerine 'sort' asamasinin
  gecici dosyalari (4-6 GB) ve cikti. Dar diskte bilerek dusurulebilir, ama alan
  biterse Planetiler isin ortasinda duser ve o ana kadarki emek bosa gider.

.PARAMETER CompressTemp
  Gecici dosyalari sikistirir. Diskten kazandirir, CPU'dan goturur; dar diskli
  makinelerde tek care bu olabiliyor.

.PARAMETER Bounds
  Uretimi bir kutuyla sinirlar: 'minlon,minlat,maxlon,maxlat'. OSM cikarimi yine
  Turkiye'nin tamami olarak iner ama yalnizca bu kutu islenir; hem disk hem sure
  ciddi duser. Dar diskte calisan bir demo icin, orn. Marmara:
  -Bounds '26.0,39.8,31.0,41.6'. Bos birakilirsa cikarimin tamami islenir.

.PARAMETER Force
  Var olan ciktilari yok sayip hepsini yeniden uretir.

.EXAMPLE
  .\maps\setup.ps1
  .\maps\setup.ps1 -MemoryGb 4 -Force
#>
param(
    [string]$Area = 'europe/turkey',
    [int]$MemoryGb = 8,
    [int]$RequiredGb = 8,
    [switch]$CompressTemp,
    [string]$Bounds = '',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# Invoke-WebRequest'in ilerleme cubugu buyuk dosyalarda indirmeyi kat kat
# yavaslatiyor; kapatilinca disk hizinda iniyor.
$ProgressPreference = 'SilentlyContinue'

$root = Join-Path (Split-Path $PSScriptRoot -Parent) '.maps'
$tiles = Join-Path $root 'tiles'
$fonts = Join-Path $tiles 'fonts'

# Planetiler'in indirme ve gecici klasorleri varsayilan olarak calisilan dizine
# gore 'data/sources' ve 'data/tmp'. Boyle birakilsaydi depo kokune gitignore'da
# olmayan bir 'data' klasoru dusuyordu; ikisi de '.maps' altina aliniyor.
$sources = Join-Path $root 'sources'
$temp = Join-Path $root 'tmp'

$name = Split-Path $Area -Leaf
$pbf = Join-Path $root "$name-latest.osm.pbf"
$jar = Join-Path $root 'planetiler.jar'
$archive = Join-Path $tiles "$name.pmtiles"
$fontZip = Join-Path $root 'noto-sans.zip'

$pbfUrl = "https://download.geofabrik.de/$Area-latest.osm.pbf"
$jarUrl = 'https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar'
$fontUrl = 'https://github.com/openmaptiles/fonts/releases/download/v2.0/noto-sans.zip'

function Write-Step($message) {
    Write-Host ''
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Get-File($url, $path, $label) {
    if ((Test-Path $path) -and -not $Force) {
        $size = [math]::Round((Get-Item $path).Length / 1MB, 1)
        Write-Host "    $label zaten var ($size MB), atlaniyor."
        return
    }

    Write-Host "    $label indiriliyor: $url"
    Invoke-WebRequest -Uri $url -OutFile $path
    $size = [math]::Round((Get-Item $path).Length / 1MB, 1)
    Write-Host "    bitti: $size MB"
}

New-Item -ItemType Directory -Force -Path $root, $tiles | Out-Null

Write-Step 'Java kontrolu'

# Planetiler 21 ve uzeri bir JDK istiyor. Surumu okumadan calistirilirsa hata
# yiginin dibinde 'UnsupportedClassVersionError' olarak cikiyor, anlasilmiyor.
$java = Get-Command java -ErrorAction SilentlyContinue

if (-not $java) {
    throw 'java bulunamadi. Planetiler icin JDK 21 veya ustu gerekiyor (adoptium.net).'
}

# Surum bilgisi stderr'e yaziliyor. PowerShell 5.1'de '2>&1' yerel komutun
# ciktisini hata kaydina sariyor ve ErrorActionPreference='Stop' altinda betigi
# durduruyor; yonlendirme bu yuzden cmd'nin icinde yapiliyor.
$banner = (cmd /c 'java -version 2>&1' | Select-Object -First 1)
Write-Host "    $banner"

Write-Step 'Kaynak dosyalar'

Get-File $jarUrl $jar 'planetiler.jar'
Get-File $pbfUrl $pbf 'OSM verisi'

# Yarim kalmis cikti var mi.
#
# Yalnizca dosya varligina bakmak yetmiyor: alan bitip Planetiler dustugunde
# geriye 16 KB'lik bir pmtiles kaliyor ve sonraki calisma onu 'zaten uretilmis'
# sayip uretimi tumden atliyordu. Gecerli bir Turkiye arsivi yuzlerce MB, o
# yuzden bu esigin altindaki her sey yok sayiliyor.
$archiveReady = (Test-Path $archive) -and ((Get-Item $archive).Length -gt 1MB)

Write-Step 'Disk alani'

$drive = Get-PSDrive -Name (Split-Path $root -Qualifier).TrimEnd(':')
$freeGb = [math]::Round($drive.Free / 1GB, 1)

Write-Host "    bos alan: $freeGb GB"

# Alan uretimin ortasinda biterse Planetiler duser ve is bosa gider; bastan
# bakiliyor. Esik -RequiredGb ile dusurulebilir.
if ($freeGb -lt $RequiredGb -and -not $archiveReady) {
    throw "Uretim icin en az $RequiredGb GB bos alan gerekiyor, $freeGb GB var. Yer acin ya da -RequiredGb ile esigi dusurun."
}

Write-Step 'Vektor karo uretimi'

if ($archiveReady -and -not $Force) {
    $size = [math]::Round((Get-Item $archive).Length / 1MB, 1)
    Write-Host "    $name.pmtiles zaten var ($size MB), atlaniyor."
}
else {
    # --download: openmaptiles profili OSM disinda da veri istiyor (kiyi
    #   cizgileri, su poligonlari, Natural Earth). Bunlar tek seferlik iner.
    # --force: ayni dosyaya tekrar uretim yapilabilsin diye.
    Write-Host "    Planetiler calisiyor; Turkiye icin 15-30 dakika surer."

    # Kutu verilmediginde argüman hiç eklenmiyor; bos bir '--bounds=' Planetiler'de
    # gecersiz kutu hatasina donuyor.
    $extra = @()

    if ($Bounds) {
        Write-Host "    yalnizca su kutu isleniyor: $Bounds"
        $extra += "--bounds=$Bounds"
    }

    # trustStoreType=WINDOWS-ROOT: Java kendi sertifika deposunu kullanir ve
    # Windows'unkine bakmaz. Kurumsal aglarda TLS trafigi araya giren bir vekil
    # tarafindan yeniden imzalandigi icin Planetiler indirme adiminda
    # 'PKIX path building failed' ile duser. Bu secenek Java'yi Windows kok
    # deposuna yonlendirir; vekil yoksa da ayni depoda genel kok sertifikalar
    # bulundugu icin bir sey degismez.
    # Butun argumanlar tirnak icinde: PowerShell tirnaksiz birakilan
    # '-Djavax.net.ssl...' ifadesini parcalayip Java'ya ana sinif adiymis gibi
    # veriyor, ayrica bosluk iceren yollar boluniyor.
    & java "-Xmx$($MemoryGb)g" '-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT' -jar $jar `
        --download `
        "--download-dir=$sources" `
        "--tmpdir=$temp" `
        "--osm-path=$pbf" `
        "--output=$archive" `
        "--compress_temp=$($CompressTemp.IsPresent.ToString().ToLower())" `
        --force `
        @extra

    if ($LASTEXITCODE -ne 0) {
        throw "Planetiler $LASTEXITCODE koduyla cikti."
    }

    # Gecici dosyalar uretimden sonra ise yaramiyor ama gigabaytlar tutuyor.
    if (Test-Path $temp) {
        Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
    }

    $size = [math]::Round((Get-Item $archive).Length / 1MB, 1)
    Write-Host "    uretildi: $size MB"
}

Write-Step 'Yazi tipleri'

if ((Test-Path (Join-Path $fonts 'Noto Sans Regular')) -and -not $Force) {
    Write-Host '    yazi tipleri zaten acilmis, atlaniyor.'
}
else {
    Get-File $fontUrl $fontZip 'Noto Sans'

    New-Item -ItemType Directory -Force -Path $fonts | Out-Null
    Expand-Archive -Path $fontZip -DestinationPath $fonts -Force

    # Italik kullanilmiyor; stil yalnizca Regular ve Bold istiyor. 35 MB
    # bosuna tasinmasin diye siliniyor.
    $italic = Join-Path $fonts 'Noto Sans Italic'

    if (Test-Path $italic) {
        Remove-Item $italic -Recurse -Force
    }

    Write-Host '    acildi.'
}

Write-Step 'Ozet'

$total = (Get-ChildItem $tiles -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host "    $tiles"
Write-Host "    tasinacak toplam boyut: $([math]::Round($total / 1GB, 2)) GB"

# Kaynaklar yalnizca uretim icin gerekli; kapali aga tasinmalari gerekmiyor.
# Silinirse sonraki uretimde tekrar inerler, o yuzden karar kullaniciya birakiliyor.
if (Test-Path $sources) {
    $spare = (Get-ChildItem $sources -Recurse -File | Measure-Object -Property Length -Sum).Sum
    Write-Host "    yer gerekirse silinebilir: $sources ($([math]::Round($spare / 1GB, 2)) GB)"
}

Write-Host ''
Write-Host '    Siradaki adim: docker compose -f maps/docker-compose.yml up -d' -ForegroundColor Green
Write-Host '    Docker yoksa karolar icin: node maps/serve.mjs' -ForegroundColor Green
Write-Host '    Ayrintilar icin maps/README.md' -ForegroundColor Green
