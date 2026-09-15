import { Component, booleanAttribute, computed, input, output, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Skeleton } from '../skeleton/skeleton';
import { TOOLTIP_HIDDEN, Tooltip, TooltipState } from '../tooltip/tooltip';

/** Çubuk ve halka grafiklerin ortak veri öğesi. */
export interface ChartItem {
  /** Öğenin adı; çubuğun yanında ve ipucunda görünür. */
  label: string;
  /** Ölçülen sayı. */
  value: number;
  /** Verilmezse grafik kendi sıralı paletini kullanır. */
  color?: string;
}

/**
 * Yatay çubuk grafik.
 *
 * Çubuk uzunlukları en büyük değere göre ölçeklenir, yani grafik mutlak bir
 * eksen değil öğeler arası karşılaştırma gösterir.
 */
@Component({
  selector: 'app-barchart',
  imports: [Skeleton, Tooltip],
  templateUrl: './barchart.html',
  styleUrl: './barchart.scss',
})
export class Barchart extends BaseComponent {
  /** Grafiğin üstündeki başlık. Boşsa çizilmez. */
  readonly title = input<string>('');

  /** Çizilecek öğeler, verildikleri sırayla yukarıdan aşağı. */
  readonly items = input<ChartItem[]>([]);

  /** Veri boşken gösterilecek metin. */
  readonly emptyText = input<string>('Veri yok');

  /** Çubukların tıklanabilir olup olmadığı. */
  readonly clickable = input(false, { transform: booleanAttribute });

  /** Tıklanan çubuğun öğesi. */
  readonly barClicked = output<ChartItem>();

  /** Ölçeğin tabanı. Bütün değerler sıfırsa sıfıra bölmemek için en az 1 kabul edilir. */
  readonly maxValue = computed(() => Math.max(1, ...this.items().map((item) => item.value)));

  /** Bir değerin çubuk genişliği, yüzde olarak. */
  percent(value: number): number {
    return (value / this.maxValue()) * 100;
  }

  /** Fare üzerindeyken gösterilen ipucunun durumu. */
  readonly tooltip = signal<TooltipState>(TOOLTIP_HIDDEN);

  /** İpucundaki yüzde payını hesaplamak için toplam. */
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.value, 0));

  /** İmlecin bulunduğu yerde değeri ve toplam içindeki payını gösterir. */
  showTooltip(item: ChartItem, event: MouseEvent): void {
    const share = this.total() === 0 ? 0 : Math.round((item.value / this.total()) * 100);

    this.tooltip.set({
      text: `${item.label}: ${item.value} (%${share})`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  /** İmleç çubuktan ayrılınca ipucunu gizler. */
  hideTooltip(): void {
    this.tooltip.set(TOOLTIP_HIDDEN);
  }
}
