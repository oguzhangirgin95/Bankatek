import { Component, computed } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Step } from '../step/step';

/**
 * Adım gövdesi. Ekran içeriğini sarar; üstüne adım şeridini, altına
 * yapılandırmadan gelen ileri/geri butonlarını koyar.
 *
 * Şerit ve butonların görünüp görünmeyeceğine adım yapılandırması karar
 * verir, bu yüzden burada koşul yoktur; bileşen yalnızca metinleri hazırlar.
 * Şerit tek adımlı akışlarda kendini çizmediği için her ekranda durabiliyor.
 */
@Component({
  selector: 'app-body',
  imports: [Step],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body extends BaseComponent {
  /** "Geri" butonunun yazısı; kaynak tanımlıysa oradan gelir. */
  readonly backText = computed(() => this.getResource('BUTTON_BACK', 'Geri'));

  /** "Devam" butonunun yazısı; kaynak tanımlıysa oradan gelir. */
  readonly continueText = computed(() => this.getResource('BUTTON_CONTINUE', 'Devam'));
}
