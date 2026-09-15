import { Component, computed, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { InfoVariant } from '../info/info';

/** Doluluk çubuğu. Bir değerin üst sınıra göre ne kadarını doldurduğunu gösterir. */
@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress extends BaseComponent {
  /** Çubuğun üstündeki açıklama. */
  readonly label = input<string>('');

  /** Ölçülen değer. */
  readonly value = input<number>(0);

  /** Üst sınır; çubuğun tamamen dolduğu değer. */
  readonly max = input<number>(100);

  /** Çubuğun rengi. Örneğin sınıra yaklaşıldığında 'warning' verilebilir. */
  readonly variant = input<InfoVariant>('info');

  /** Sayısal değerin çubuğun yanında yazılıp yazılmayacağı. */
  readonly showValue = input<boolean>(true);

  /**
   * Doluluk yüzdesi.
   *
   * max sıfır gelirse bölme hatası olmasın diye 1 kabul edilir; sonuç ayrıca
   * 0-100 aralığına kırpılır ki değer sınırı aştığında çubuk taşmasın.
   */
  readonly percent = computed(() => {
    const max = this.max() || 1;
    return Math.min(100, Math.max(0, (this.value() / max) * 100));
  });
}
