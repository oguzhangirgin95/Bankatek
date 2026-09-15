import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Button } from '../button/button';
import { Menu } from '../menu/menu';
import { Theme } from '../theme/theme';
import { KeycloakService } from '@lib/base/baseservice/keycloakservice';

/** "Pano" butonunun gittiği ekran. */
const HOME = '/monitoring/dashboard/start';

/** Üst şerit: menü, pano kısayolu, tema seçimi, kullanıcı adı ve çıkış. */
@Component({
  selector: 'app-header',
  imports: [Button, Menu, Theme],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header extends BaseComponent {
  private readonly keycloakService = inject(KeycloakService);

  private readonly router = inject(Router);

  /**
   * İlk çizimden sonra true olur.
   *
   * Kullanıcıya özel kısımlar (token'dan gelen ad, çıkış butonu) sunucu
   * tarafında bilinmiyor. Doğrudan gösterilirse sunucunun ürettiği HTML ile
   * tarayıcının çizdiği farklı olur ve hidrasyon uyuşmazlığı çıkar; o yüzden
   * bu kısımlar tarayıcı devralana kadar gizli tutuluyor.
   */
  readonly ready = signal(false);

  /** Ekran metinleri. */
  readonly labels = computed(() => ({
    home: this.getResource('MENU_DASHBOARD', 'Pano'),
    logout: this.getResource('BUTTON_LOGOUT', 'Çıkış'),
  }));

  /** Zaten panodaysak "Pano" butonunu göstermeye gerek yok. */
  readonly atHome = computed(() => this.flowService.url() === HOME);

  /** Keycloak token'ındaki preferred_username. */
  readonly username = this.keycloakService.username;

  /** İlk çizim tamamlanınca kullanıcıya özel kısımların önü açılır. */
  constructor() {
    super();
    afterNextRender(() => this.ready.set(true));
  }

  /** Panoya döner. */
  goHome() {
    this.router.navigateByUrl(HOME);
  }

  /** Çıkış. Keycloak oturumu kapatılır, tarayıcı Keycloak'a yönlenir. */
  logout() {
    this.featureFlagService.clearFeatures();
    this.keycloakService.logout();
  }
}
