import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * İçeriği çerçeveleyen kart. İçerik ng-content ile dışarıdan verilir.
 *
 * Başlık verilmezse üst bant hiç çizilmez; böylece aynı bileşen hem başlıklı
 * panel hem de sade bir kutu olarak kullanılabilir.
 */
@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card extends BaseComponent {
  /** Üst banttaki başlık. Boş bırakılırsa bant çizilmez. */
  readonly title = input<string>('');

  /** Başlığın sağında gösterilen ikincil metin, genelde kısa bir ipucu. */
  readonly subtitle = input<string>('');
}
