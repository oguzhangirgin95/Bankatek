import { Component, booleanAttribute, computed, input, output, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { ChartItem } from '../barchart/barchart';
import { Skeleton } from '../skeleton/skeleton';
import { TOOLTIP_HIDDEN, Tooltip, TooltipState } from '../tooltip/tooltip';

export type { ChartItem };

/** Desteklenen grafik türleri. */
export type ChartType = 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'stacked';

/** Renk verilmeyen öğeler bu paletten sırayla boyanır. */
const COLORS = [
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-violet)',
  'var(--color-teal)',
];

/** Kartezyen grafiklerin çizim alanı; viewBox 100 x 60. */
const FLOOR = 52;
const CEILING = 6;

interface Slice extends ChartItem {
  color: string;
  path: string;
  share: number;
}

interface Column extends ChartItem {
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Segment extends ChartItem {
  color: string;
  start: number;
  width: number;
}

/** Daire üzerindeki bir açının koordinatı. Açı tepeden başlar. */
function polar(radius: number, angle: number): { x: number; y: number } {
  const radian = ((angle - 90) * Math.PI) / 180;

  return { x: 50 + radius * Math.cos(radian), y: 50 + radius * Math.sin(radian) };
}

/** İki açı arasındaki dilimin yolu. İç yarıçap sıfırsa pasta, değilse halka. */
function arc(from: number, to: number, outer: number, inner: number): string {
  const large = to - from > 180 ? 1 : 0;
  const a = polar(outer, to);
  const b = polar(outer, from);

  if (inner === 0) {
    return `M50 50 L${a.x.toFixed(2)} ${a.y.toFixed(2)} A${outer} ${outer} 0 ${large} 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
  }

  const c = polar(inner, from);
  const d = polar(inner, to);

  return (
    `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${outer} ${outer} 0 ${large} 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)} ` +
    `L${c.x.toFixed(2)} ${c.y.toFixed(2)} A${inner} ${inner} 0 ${large} 1 ${d.x.toFixed(2)} ${d.y.toFixed(2)} Z`
  );
}

/**
 * Bütün grafik türlerini tek çatı altında toplayan bileşen.
 *
 * Aynı veriyle (`ChartItem[]`) yalnızca `type` değiştirilerek çubuk, sütun,
 * çizgi, alan, pasta, halka ve yığılmış çubuk çizilebilir. Kütüphane
 * kullanılmıyor; kartezyen türler 100x60, dairesel türler 100x100 viewBox
 * içinde SVG olarak üretiliyor.
 */
@Component({
  selector: 'app-chart',
  imports: [Skeleton, Tooltip],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart extends BaseComponent {
  readonly title = input<string>('');

  readonly type = input<ChartType>('bar');

  readonly items = input<ChartItem[]>([]);

  readonly emptyText = input<string>('Veri yok');

  readonly legend = input(true, { transform: booleanAttribute });

  readonly itemClicked = output<ChartItem>();

  readonly tooltip = signal<TooltipState>(TOOLTIP_HIDDEN);

  /** Renkleri çözülmüş öğeler; bütün türler bunun üzerinden çiziliyor. */
  readonly colored = computed(() =>
    this.items().map((item, index) => ({ ...item, color: item.color || COLORS[index % COLORS.length] })),
  );

  readonly total = computed(() => this.colored().reduce((sum, item) => sum + item.value, 0));

  readonly max = computed(() => Math.max(1, ...this.colored().map((item) => item.value)));

  readonly circular = computed(() => this.type() === 'pie' || this.type() === 'donut');

  /** Tek öğe tam daire olur; yay matematiği 360 derecede bozulduğu için ayrılıyor. */
  readonly single = computed(() => this.circular() && this.colored().length === 1);

  readonly slices = computed<Slice[]>(() => {
    const total = this.total() || 1;
    const inner = this.type() === 'donut' ? 26 : 0;
    let angle = 0;

    return this.colored().map((item) => {
      const sweep = (item.value / total) * 360;
      const slice = { ...item, share: (item.value / total) * 100, path: arc(angle, angle + sweep, 42, inner) };

      angle += sweep;

      return slice;
    });
  });

  readonly columns = computed<Column[]>(() => {
    const items = this.colored();
    const step = 100 / Math.max(1, items.length);
    const width = step * 0.62;

    return items.map((item, index) => {
      const height = (item.value / this.max()) * (FLOOR - CEILING);

      return { ...item, x: index * step + (step - width) / 2, y: FLOOR - height, width, height };
    });
  });

  /** Çizgi ve alan için nokta dizisi. Tek nokta varsa yatay çizgi çizilir. */
  readonly points = computed(() => {
    const items = this.colored();

    if (items.length === 0) {
      return '';
    }

    const step = items.length === 1 ? 0 : 100 / (items.length - 1);

    return items
      .map((item, index) => {
        const y = FLOOR - (item.value / this.max()) * (FLOOR - CEILING);

        return `${(items.length === 1 ? 50 : index * step).toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });

  readonly areaPoints = computed(() => {
    const points = this.points();

    return points ? `0,${FLOOR} ${points} 100,${FLOOR}` : '';
  });

  readonly segments = computed<Segment[]>(() => {
    const total = this.total() || 1;
    let start = 0;

    return this.colored().map((item) => {
      const width = (item.value / total) * 100;
      const segment = { ...item, start, width };

      start += width;

      return segment;
    });
  });

  /** Yatay çubuk türünde bir öğenin dolu oranı. */
  percent(value: number): number {
    return (value / this.max()) * 100;
  }

  share(value: number): number {
    return this.total() === 0 ? 0 : Math.round((value / this.total()) * 100);
  }

  showTooltip(item: ChartItem, event: MouseEvent): void {
    this.tooltip.set({
      text: `${item.label}: ${item.value} (%${this.share(item.value)})`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  hideTooltip(): void {
    this.tooltip.set(TOOLTIP_HIDDEN);
  }
}
