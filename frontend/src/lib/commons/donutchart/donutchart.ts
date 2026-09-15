import { Component, computed, input, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { ChartItem } from '../barchart/barchart';
import { Skeleton } from '../skeleton/skeleton';
import { TOOLTIP_HIDDEN, Tooltip, TooltipState } from '../tooltip/tooltip';

/**
 * Öğenin kendi rengi yoksa sırayla kullanılan palet.
 *
 * Sabit renk yerine tema değişkenleri tutulur ki grafikler de seçilen temaya
 * uysun. Anlamlı bir eşleşme gerekiyorsa (durum -> renk gibi) çağıran ekran
 * ChartItem.color ile kendi rengini verir; sıraya güvenmek yanıltıcı olur.
 */
const COLORS = [
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-violet)',
  'var(--color-teal)',
];

/**
 * Halka grafik.
 *
 * Her dilim için ayrı bir yay çizmek yerine tek bir daire kullanılır; dilimler
 * stroke-dasharray ile "şu kadarı dolu, gerisi boşluk" diye tanımlanıp
 * stroke-dashoffset ile başlangıç noktalarına kaydırılır. Böylece trigonometri
 * ve path hesabı gerekmez.
 */
@Component({
  selector: 'app-donutchart',
  imports: [Skeleton, Tooltip],
  templateUrl: './donutchart.html',
  styleUrl: './donutchart.scss',
})
export class Donutchart extends BaseComponent {
  /** Grafiğin üstündeki başlık. Boşsa çizilmez. */
  readonly title = input<string>('');

  /** Dilimler, verildikleri sırayla saat yönünde. */
  readonly items = input<ChartItem[]>([]);

  /** Veri boşken gösterilecek metin. */
  readonly emptyText = input<string>('Veri yok');

  /** Tüm dilimlerin toplamı; halkanın ortasında da bu sayı yazar. */
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.value, 0));

  /**
   * Dilimleri hesaplar.
   *
   * Her dilim çevrenin kendi payı kadarını dolu bırakıp gerisini boşluk yapar;
   * offset ise bir önceki dilimin bittiği yere kaydırır. Toplam sıfırsa
   * bölme hatası olmasın diye 1 kabul edilir, dilimler de sıfır uzunlukta kalır.
   */
  readonly segments = computed(() => {
    const total = this.total() || 1;
    // Yarıçap 40; şablondaki <circle r="40"> ile aynı olmak zorunda.
    const circumference = 2 * Math.PI * 40;
    let start = 0;

    return this.items().map((item, index) => {
      const length = (item.value / total) * circumference;
      const segment = {
        label: item.label,
        value: item.value,
        color: item.color || COLORS[index % COLORS.length],
        dash: `${length} ${circumference - length}`,
        offset: -start,
        percent: Math.round((item.value / total) * 100),
      };
      start += length;
      return segment;
    });
  });

  /** Fare üzerindeyken gösterilen ipucunun durumu. */
  readonly tooltip = signal<TooltipState>(TOOLTIP_HIDDEN);

  /** İmlecin bulunduğu yerde dilimin değerini ve yüzdesini gösterir. */
  showTooltip(segment: { label: string; value: number; percent: number }, event: MouseEvent): void {
    this.tooltip.set({
      text: `${segment.label}: ${segment.value} (%${segment.percent})`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  /** İmleç dilimden ayrılınca ipucunu gizler. */
  hideTooltip(): void {
    this.tooltip.set(TOOLTIP_HIDDEN);
  }
}
