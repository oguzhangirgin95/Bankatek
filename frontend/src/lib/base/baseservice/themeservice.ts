import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { BaseService } from './baseservice';

/** Tek bir tema. colors alanı, :root üzerine yazılan CSS değişkenleridir. */
export interface Palette {
  /** Kalıcı anahtar; localStorage'da saklanan değer budur. */
  code: string;
  /** Tema seçicide görünen ad. */
  name: string;
  /** '--color-bg' gibi değişken adından değere eşleme. */
  colors: Record<string, string>;
}


/**
 * Palet üretici. Bir palet iki tondan oluşur:
 * baseHue -> zemin, kart, çizgi ve yazı renkleri
 * accentHue/accentLight -> vurgu rengi (buton, seçili durum)
 *
 * accentLight, üzerine beyaz yazı geldiğinde okunaklı kalan en parlak değerdir;
 * bu yüzden her renk tonu için ayrı ayrı seçilmiş durumda.
 */
function build(code: string, name: string, baseHue: number, accentHue: number, accentLight: number): Palette {
  return {
    code,
    name,
    colors: {
      '--color-bg': `hsl(${baseHue} 45% 8%)`,
      '--color-surface': `hsl(${baseHue} 42% 14%)`,
      '--color-surface-2': `hsl(${baseHue} 40% 19%)`,
      '--color-border': `hsl(${baseHue} 38% 28%)`,
      '--color-border-strong': `hsl(${baseHue} 36% 40%)`,
      '--color-text': `hsl(${baseHue} 30% 97%)`,
      '--color-muted': `hsl(${baseHue} 25% 74%)`,
      '--color-accent': `hsl(${accentHue} 75% ${accentLight}%)`,
      '--color-accent-dark': `hsl(${accentHue} 78% ${accentLight - 9}%)`,
      '--color-accent-soft': `hsl(${accentHue} 75% ${accentLight}% / 0.24)`,
      '--color-on-accent': '#ffffff',
    },
  };
}

/**
 * Seçilebilecek temalar.
 *
 * İlk dördü elle ayarlanmış özel paletler; gerisi build() ile hue değerinden
 * üretiliyor. Sıra tema seçicideki görünüm sırasıdır, varsayılanı belirlemez;
 * onu DEFAULT_CODE söyler.
 */
export const PALETTES: Palette[] = [
  {
    code: 'navy',
    name: 'Lacivert',
    colors: {
      '--color-bg': '#0a1f44',
      '--color-surface': '#102a5c',
      '--color-surface-2': '#16376f',
      '--color-border': '#214b92',
      '--color-border-strong': '#2f63b8',
      '--color-text': '#ffffff',
      '--color-muted': '#a9c0e2',
      '--color-accent': '#e30a17',
      '--color-accent-dark': '#b3050f',
      '--color-accent-soft': 'rgba(227, 10, 23, 0.22)',
      '--color-on-accent': '#ffffff',
    },
  },
  {
    code: 'graphite',
    name: 'Antrasit',
    colors: {
      '--color-bg': '#14171c',
      '--color-surface': '#1c2027',
      '--color-surface-2': '#252b34',
      '--color-border': '#333a45',
      '--color-border-strong': '#4a5462',
      '--color-text': '#f0f3f7',
      '--color-muted': '#9aa6b4',
      '--color-accent': '#ff7a1a',
      '--color-accent-dark': '#d9600c',
      '--color-accent-soft': 'rgba(255, 122, 26, 0.22)',
      '--color-on-accent': '#12161b',
    },
  },
  {
    code: 'olive',
    name: 'Haki',
    colors: {
      '--color-bg': '#101a13',
      '--color-surface': '#17251c',
      '--color-surface-2': '#1f3126',
      '--color-border': '#2d4738',
      '--color-border-strong': '#41654f',
      '--color-text': '#f0f6f2',
      '--color-muted': '#9cbaa8',
      '--color-accent': '#e0a913',
      '--color-accent-dark': '#b3840a',
      '--color-accent-soft': 'rgba(224, 169, 19, 0.22)',
      '--color-on-accent': '#12161b',
    },
  },
  {
    code: 'wine',
    name: 'Bordo',
    colors: {
      '--color-bg': '#1a0f16',
      '--color-surface': '#26161f',
      '--color-surface-2': '#331d29',
      '--color-border': '#4a2b3b',
      '--color-border-strong': '#6b3e55',
      '--color-text': '#f8eef3',
      '--color-muted': '#c8a3b4',
      '--color-accent': '#cb0c2c',
      '--color-accent-dark': '#a40924',
      '--color-accent-soft': 'rgba(203, 12, 44, 0.26)',
      '--color-on-accent': '#ffffff',
    },
  },
  build('midnight', 'Gece Mavisi', 220, 212, 47),
  build('ocean', 'Okyanus', 202, 192, 34),
  build('turquoise', 'Turkuaz', 186, 176, 28),
  build('cyan', 'Camgöbeği', 192, 196, 36),
  build('emerald', 'Zümrüt', 162, 152, 29),
  build('grass', 'Çimen', 132, 122, 30),
  build('pistachio', 'Fıstık', 102, 92, 29),
  build('olive2', 'Zeytin', 82, 76, 28),
  build('gold', 'Altın', 46, 45, 31),
  build('amber', 'Kehribar', 36, 36, 35),
  build('orange', 'Turuncu', 26, 26, 40),
  build('copper', 'Bakır', 20, 18, 43),
  build('brick', 'Kiremit', 14, 12, 46),
  build('crimson', 'Kızıl', 356, 0, 51),
  build('rose', 'Gül', 346, 345, 50),
  build('fuchsia', 'Fuşya', 326, 320, 47),
  build('orchid', 'Orkide', 302, 300, 44),
  build('purple', 'Mor', 282, 276, 57),
  build('violet', 'Menekşe', 266, 264, 60),
  build('indigo', 'Çivit', 252, 250, 60),
  build('sapphire', 'Safir', 232, 226, 58),
  build('cobalt', 'Kobalt', 224, 216, 51),
  build('ice', 'Buz', 206, 200, 38),
  build('sea', 'Deniz', 196, 186, 31),
  build('mint', 'Nane', 166, 160, 29),
  build('moss', 'Yosun', 146, 140, 29),
  build('forest', 'Orman', 140, 130, 30),
  build('army', 'Asker', 96, 86, 28),
  build('mustard', 'Hardal', 56, 50, 30),
  build('sand', 'Kum', 40, 40, 33),
  build('cinnamon', 'Tarçın', 28, 22, 42),
  build('coffee', 'Kahve', 22, 16, 44),
  build('cherry', 'Vişne', 350, 350, 50),
  build('claret', 'Şarap', 340, 336, 49),
  build('redbud', 'Erguvan', 316, 310, 46),
  build('lavender', 'Lavanta', 270, 268, 60),
  build('amethyst', 'Ametist', 286, 286, 52),
  build('sky', 'Gökyüzü', 210, 204, 41),
  build('navyblue', 'Denizci', 216, 220, 54),
  build('petrol', 'Petrol', 190, 180, 28),
  build('jade', 'Yeşim', 156, 146, 29),
  build('bamboo', 'Bambu', 112, 100, 29),
  build('lemon', 'Limon', 66, 60, 26),
  build('honey', 'Bal', 42, 38, 34),
  build('melon', 'Kavun', 18, 20, 42),
  build('coral', 'Mercan', 8, 6, 48),
  build('ruby', 'Yakut', 358, 354, 50),
  build('carnation', 'Karanfil', 336, 330, 48),
];

/** Tema seçiminin localStorage'da saklandığı anahtar. */
const STORAGE_KEY = 'bankatek-theme';

/** Hiç seçim yapmamış kullanıcının göreceği tema. */
const DEFAULT_CODE = 'cobalt';

/**
 * Tema seçimi.
 *
 * Paletin renklerini :root üzerindeki CSS değişkenlerine yazar ve seçimi
 * localStorage'da saklar. Bileşenler sabit renk yerine bu değişkenleri
 * kullandığı sürece bütün arayüz seçilen temaya kendiliğinden uyar.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService extends BaseService {
  private readonly document = inject(DOCUMENT);

  /** Seçilebilecek bütün paletler. */
  readonly palettes = PALETTES;

  /** Varsayılan tema. Listenin ilki değil, DEFAULT_CODE ile belirlenen palet;
   * böylece seçicideki sıralama değişse de varsayılan sabit kalır. */
  readonly defaultPalette = this.palettes.find((item) => item.code === DEFAULT_CODE) ?? this.palettes[0];

  /** Uygulanan paletin kodu. apply() her çağrıldığında güncellenir. */
  readonly current = signal<string>(this.defaultPalette.code);

  /** Servis oluşur oluşmaz saklanan tema uygulanır; ekran renksiz açılmaz. */
  constructor() {
    super();
    this.apply(this.read());
  }

  /** Temayı uygular ve seçimi saklar. Tanınmayan kod varsayılana düşer. */
  apply(code: string): void {
    const palette = this.palettes.find((item) => item.code === code) ?? this.defaultPalette;

    Object.keys(palette.colors).forEach((name) =>
      this.document.documentElement.style.setProperty(name, palette.colors[name]),
    );

    // Mobil tarayıcılarda adres çubuğunun rengi de temayla birlikte değişsin.
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.colors['--color-bg']);

    this.current.set(palette.code);
    this.write(palette.code);
  }

  /** Varsayılan temaya döner. */
  reset(): void {
    this.apply(this.defaultPalette.code);
  }

  /** Sıfırla butonunun pasif olup olmayacağını belirler. */
  isDefault(): boolean {
    return this.current() === this.defaultPalette.code;
  }

  /** Saklanan seçimi okur. Depolamaya erişilemezse varsayılan kod döner. */
  private read(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? this.defaultPalette.code;
    } catch {
      return this.defaultPalette.code;
    }
  }

  /** Seçimi saklar. Depolama kapalıysa sessizce geçilir. */
  private write(code: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      return;
    }
  }
}
