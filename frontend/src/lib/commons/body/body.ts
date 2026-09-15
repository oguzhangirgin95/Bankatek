import { Component, computed } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Adım gövdesi. Ekran içeriğini sarar ve altına yapılandırmadan gelen
 * ileri/geri butonlarını koyar.
 *
 * Butonların görünüp görünmeyeceğine adım yapılandırması karar verir, bu
 * yüzden burada koşul yoktur; bileşen yalnızca metinleri hazırlar.
 */
@Component({
  selector: 'app-body',
  imports: [],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body extends BaseComponent {
  /** "Geri" butonunun yazısı; kaynak tanımlıysa oradan gelir. */
  readonly backText = computed(() => this.getResource('BUTTON_BACK', 'Geri'));

  /** "Devam" butonunun yazısı; kaynak tanımlıysa oradan gelir. */
  readonly continueText = computed(() => this.getResource('BUTTON_CONTINUE', 'Devam'));
}
