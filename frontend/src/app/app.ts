import { Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Body } from '@lib/commons/body/body';
import { Footer } from '@lib/commons/footer/footer';
import { Header } from '@lib/commons/header/header';
import { Tour } from '@lib/commons/tour/tour';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Body, Footer, Tour],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    // Modulun rengi burada tanimlanir; header, menu ve arka plan katmani
    // devralarak kullanir. Modul yapilandirmasi yoksa temanin vurgusu gecerli.
    '[style.--color-module]': 'moduleColor()',
  },
})
export class App extends BaseComponent implements OnInit {

  private readonly platformId = inject(PLATFORM_ID);

  /** İçinde bulunulan modülün yapılandırması. */
  private readonly moduleConfig = this.flowService.moduleConfig;

  /**
   * Modülün rengi. Yapılandırma henüz okunmadıysa boş metin döner; o zaman
   * '--color-module' hiç tanımlanmaz ve stiller temanın vurgusuna düşer.
   */
  readonly moduleColor = computed(() => this.moduleConfig()?.color ?? '');

  /**
   * Arka plandaki hareketli görselin CSS değeri.
   *
   * Özel değişkene yazılıyor, doğrudan background-image'a değil: böylece
   * animasyonu olmayan durumda stil dosyasındaki yedek değer geçerli kalır.
   */
  readonly moduleBackground = computed(() => {
    const background = this.moduleConfig()?.background;

    return background ? `url('${background}')` : '';
  });

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.featureFlagService.ensureLoaded(this.flowService.token());
  }
}
