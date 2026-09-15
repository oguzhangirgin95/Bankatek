import { Component, input, output } from '@angular/core';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Proje genelinde kullanılan buton.
 *
 * Görünümü variant belirler; renkler global stilden geldiği için burada
 * renk tanımı yoktur.
 */
@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button extends BaseComponent {
  /** Buton yazısı. İçerik ng-content ile de verilebilir. */
  readonly label = input<string>('');

  /** Görünüm: dolu (primary), ikincil ya da yalnızca çerçeveli. */
  readonly variant = input<FlowButtonVariant>('primary');

  /** Form içinde submit davranışı gerekiyorsa 'submit' verilir. */
  readonly type = input<'button' | 'submit'>('button');

  /** Pasif buton tıklanamaz ve soluk görünür. */
  readonly disabled = input<boolean>(false);

  /** Tıklama. Pasif butonda tarayıcı zaten olay üretmez. */
  readonly clicked = output<void>();
}
