import { Component, input, output } from '@angular/core';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Proje genelinde kullanılan buton.
 *
 * Görünümü variant belirler; renkler global stilden geldiği için burada
 * renk tanımı yoktur.
 *
 * host'ta id null'a çekiliyor çünkü id'nin asıl sahibi içerideki <button>
 * elemanı; aksi halde hem sarmalayıcıda hem butonda aynı id olur ve id'ye
 * göre yazılan stil ya da tur hedefi yanlış elemanı bulur.
 */
@Component({
  selector: 'app-button',
  host: { '[attr.id]': 'null' },
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button extends BaseComponent {
  /**
   * Butonun kimliği; içteki <button> elemanına konur. Yalnızca bu butona özel
   * stil (#id) ya da tanıtım turu hedefi için kullanılır. Boşsa id yazılmaz.
   */
  readonly id = input<string>('');

  /** Buton yazısı. İçerik ng-content ile de verilebilir. */
  readonly label = input<string>('');

  /** Görünüm: dolu (primary), ikincil ya da yalnızca çerçeveli. */
  readonly variant = input<FlowButtonVariant>('primary');

  /** Form içinde submit davranışı gerekiyorsa 'submit' verilir. */
  readonly type = input<'button' | 'submit'>('button');

  /** Pasif buton tıklanamaz ve soluk görünür. */
  readonly disabled = input<boolean>(false);

  /**
   * Butona eklenecek ek sınıflar, boşlukla ayrılarak verilir.
   *
   * Variant sınıflarının yerini almaz, yanlarına eklenir. Sınıf butonun
   * kendisine konduğu için stili global stilde ya da ::ng-deep ile yazılmalı.
   */
  readonly cssClass = input<string>('');

  /** Tıklama. Pasif butonda tarayıcı zaten olay üretmez. */
  readonly clicked = output<void>();
}
