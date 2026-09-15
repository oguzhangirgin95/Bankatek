import { Component, booleanAttribute, input, output } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { InfoVariant } from '../info/info';

/**
 * Tek bir sayıyı öne çıkaran özet kartı.
 *
 * Sol kenarındaki renkli çizgiyi variant belirler. Tıklanabilir yapıldığında
 * filtre kısayolu olarak da kullanılır; panoda durum kartlarına basıldığında
 * harita buna göre değişiyor.
 */
@Component({
  selector: 'app-statcard',
  imports: [],
  templateUrl: './statcard.html',
  styleUrl: './statcard.scss',
})
export class Statcard extends BaseComponent {
  /** Sayının altındaki açıklama, örneğin "Toplam müşteri". */
  readonly label = input<string>('');

  /** Öne çıkan değer. Sayı olmayan özetler için metin de verilebilir. */
  readonly value = input<string | number>('');

  /** İsteğe bağlı ek satır; değeri açıklayan kısa bir not. */
  readonly hint = input<string>('');

  /** Sol kenar çizgisinin rengi. */
  readonly variant = input<InfoVariant>('info');

  /** Kartın tıklanabilir görünüp görünmeyeceği. */
  readonly clickable = input(false, { transform: booleanAttribute });

  /** Tıklama. clickable verilmese de yayılır, sadece görünüm değişir. */
  readonly clicked = output<void>();
}
