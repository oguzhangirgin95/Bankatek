import { Component, computed } from '@angular/core';
import { BaseComponent } from '../basecomponent';

/**
 * Yapılandırmadan gelen sonuç adımı.
 *
 * State'teki 'executeResponse' nesnesini anahtar/değer listesine çevirip
 * gösterir; işlemin sonucunu bildiren son ekranlar bunu kullanır.
 */
@Component({
  imports: [],
  templateUrl: './commonexecute.html',
  styleUrl: './commonexecute.scss',
})
export class Commonexecute extends BaseComponent {
  /** Yanıt nesnesini ekranda listelenecek satırlara çevirir. */
  readonly items = computed(() => {
    const response = this.flowService.get<Record<string, any>>('executeResponse') ?? {};
    return Object.entries(response).map(([key, value]) => ({ key, value }));
  });
}
