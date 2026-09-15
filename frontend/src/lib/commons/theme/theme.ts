import { Component, computed, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Palette } from '@lib/base/baseservice/themeservice';

/**
 * Üst şeritteki tema seçici.
 *
 * Temayı uygulamak ve saklamak ThemeService'in işi; burada yalnızca listenin
 * açık olup olmadığı tutulur.
 */
@Component({
  selector: 'app-theme',
  imports: [],
  templateUrl: './theme.html',
  styleUrl: './theme.scss',
})
export class Theme extends BaseComponent {
  /** Seçilebilecek bütün paletler. */
  readonly palettes = this.themeService.palettes;

  /** Şu an uygulanan paletin kodu. */
  readonly current = this.themeService.current;

  /** Palet listesinin açık olup olmadığı. */
  readonly open = signal(false);

  /** Seçili palet. Kod tanınmazsa listedeki ilkine düşer ki arayüz boş kalmasın. */
  readonly active = computed(
    () => this.palettes.find((palette) => palette.code === this.current()) ?? this.palettes[0],
  );

  /** Ekran metinleri. */
  readonly labels = computed(() => ({
    theme: this.getResource('THEME_TITLE', 'Tema'),
    reset: this.getResource('THEME_RESET', 'Varsayılan temaya dön'),
  }));

  /** Palet listesini açar ya da kapatır. */
  toggle(): void {
    this.open.update((value) => !value);
  }

  /** Listeyi kapatır. Dışarı tıklandığında da çağrılır. */
  close(): void {
    this.open.set(false);
  }

  /** Seçilen temayı uygular ve listeyi kapatır. */
  select(code: string): void {
    this.themeService.apply(code);
    this.close();
  }

  /** Varsayılan temaya döner. */
  reset(): void {
    this.themeService.reset();
    this.close();
  }

  /** Sıfırla butonu, zaten varsayılan temadaysak pasifleşir. */
  isDefault(): boolean {
    return this.themeService.isDefault();
  }

  /**
   * Listedeki önizleme karesi: paletin zemin ve vurgu rengini çaprazdan
   * ikiye böler, böylece tema tek bakışta ayırt edilir.
   */
  swatch(palette: Palette): string {
    return `linear-gradient(135deg, ${palette.colors['--color-surface']} 50%, ${palette.colors['--color-accent']} 50%)`;
  }
}
