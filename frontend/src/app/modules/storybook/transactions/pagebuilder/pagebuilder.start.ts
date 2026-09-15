import { DOCUMENT, Component, computed, inject, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Barchart, ChartItem } from '@lib/commons/barchart/barchart';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { Grid, GridColumn } from '@lib/commons/grid/grid';
import { Info } from '@lib/commons/info/info';
import { List, ListItem } from '@lib/commons/list/list';
import { Map, MapPoint } from '@lib/commons/map/map';
import { Progress } from '@lib/commons/progress/progress';
import { Ringprogress } from '@lib/commons/ringprogress/ringprogress';
import { Statcard } from '@lib/commons/statcard/statcard';

export type BlockType =
  | 'statcard'
  | 'info'
  | 'progress'
  | 'ringprogress'
  | 'list'
  | 'grid'
  | 'barchart'
  | 'donutchart'
  | 'map';

/** Paletteki ya da sayfadaki tek bir bileşen. */
export interface PageBlock {
  id: number;
  type: BlockType;
  label: string;
  /** Blok sayfanın tam genişliğini mi kaplasın. */
  wide?: boolean;
}

const PALETTE: PageBlock[] = [
  { id: 0, type: 'statcard', label: 'Özet kart' },
  { id: 0, type: 'info', label: 'Bilgi şeridi' },
  { id: 0, type: 'progress', label: 'İlerleme çubuğu' },
  { id: 0, type: 'ringprogress', label: 'Dairesel ilerleme' },
  { id: 0, type: 'list', label: 'Anahtar/değer listesi' },
  { id: 0, type: 'grid', label: 'Tablo', wide: true },
  { id: 0, type: 'barchart', label: 'Çubuk grafik', wide: true },
  { id: 0, type: 'donutchart', label: 'Halka grafik' },
  { id: 0, type: 'map', label: 'Harita', wide: true },
];

@Component({
  imports: [Barchart, Button, Card, Donutchart, Grid, Info, List, Map, Progress, Ringprogress, Statcard],
  templateUrl: './pagebuilder.start.html',
  styleUrl: './pagebuilder.scss',
})
export class PagebuilderStart extends BaseComponent {
  private readonly document = inject(DOCUMENT);

  readonly palette = PALETTE;

  readonly blocks = signal<PageBlock[]>([]);

  readonly empty = computed(() => this.blocks().length === 0);

  readonly chart: ChartItem[] = [
    { label: 'Ankara', value: 42 },
    { label: 'İstanbul', value: 35 },
    { label: 'İzmir', value: 23 },
  ];

  readonly details: ListItem[] = [
    { key: 'IBAN', value: 'TR06 0006 0000 0000 0020 04' },
    { key: 'Şube', value: 'Kadıköy Şubesi' },
    { key: 'Durum', value: 'Aktif' },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', title: 'Şehir' },
    { field: 'count', title: 'Transfer' },
  ];

  readonly rows = [
    { name: 'Ankara', count: 42 },
    { name: 'İstanbul', count: 35 },
    { name: 'İzmir', count: 23 },
  ];

  readonly points: MapPoint[] = [
    { id: '06', name: 'Ankara', x: 0, y: 0, value: 42 },
    { id: '34', name: 'İstanbul', x: 0, y: 0, value: 35 },
    { id: '35', name: 'İzmir', x: 0, y: 0, value: 23 },
  ];

  private nextId = 1;

  /** Paletten sürüklenen tür; sayfadan sürükleniyorsa boş kalır. */
  private readonly incoming = signal<PageBlock | null>(null);

  /** Sayfa içinde yer değiştirirken sürüklenen bloğun sırası. */
  private readonly moving = signal<number>(-1);

  /** Bırakma çizgisinin gösterileceği sıra. */
  readonly target = signal<number>(-1);

  dragFromPalette(item: PageBlock): void {
    this.incoming.set(item);
    this.moving.set(-1);
  }

  dragFromPage(index: number): void {
    this.incoming.set(null);
    this.moving.set(index);
  }

  over(event: DragEvent, index: number): void {
    event.preventDefault();
    this.target.set(index);
  }

  leave(): void {
    this.target.set(-1);
  }

  drop(event: DragEvent, index: number): void {
    event.preventDefault();

    const item = this.incoming();
    const from = this.moving();

    this.blocks.update((current) => {
      const next = [...current];
      const at = index < 0 || index > next.length ? next.length : index;

      if (item) {
        next.splice(at, 0, { ...item, id: this.nextId++ });

        return next;
      }

      if (from < 0 || from >= next.length) {
        return next;
      }

      const [block] = next.splice(from, 1);

      next.splice(from < at ? at - 1 : at, 0, block);

      return next;
    });

    this.incoming.set(null);
    this.moving.set(-1);
    this.target.set(-1);
  }

  remove(index: number): void {
    this.blocks.update((current) => current.filter((block, position) => position !== index));
  }

  clear(): void {
    this.blocks.set([]);
  }

  /**
   * Sayfanın PDF raporu.
   *
   * Projede documentview'ün kullandığı yol: gizli iframe'e yazdırılacak belge
   * yazılır ve print çağrılır, kullanıcı "PDF olarak kaydet" der. Kütüphane
   * gerekmiyor.
   *
   * Sayfadaki işaretleme olduğu gibi kopyalanıyor; bileşen stilleri kapsamlı
   * (_ngcontent) olduğu için belgedeki bütün stil etiketleri ve stil bağlantıları
   * da birlikte taşınıyor, yoksa çıktı biçimsiz kalırdı.
   */
  report(): void {
    const canvas = this.document.querySelector('.builder__canvas');

    if (!canvas || this.empty()) {
      return;
    }

    const frame = this.document.createElement('iframe');

    frame.setAttribute('style', 'position:fixed;width:0;height:0;border:0;');
    this.document.body.appendChild(frame);

    const win = frame.contentWindow;

    if (!win) {
      frame.remove();
      return;
    }

    win.document.write(this.getReportHtml(canvas.innerHTML));
    win.document.close();
    win.focus();
    win.print();

    setTimeout(() => frame.remove(), 1000);
  }

  private getReportHtml(content: string): string {
    const styles = Array.from(this.document.querySelectorAll('style'))
      .map((style) => `<style>${style.innerHTML}</style>`)
      .join('');

    const links = Array.from(this.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((link) => `<link rel="stylesheet" href="${link.href}">`)
      .join('');

    const title = this.getResource('PAGEBUILDER_REPORT', 'Sayfa raporu');
    const stamp = new Date().toLocaleString('tr-TR');

    return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>${title}</title>${links}${styles}
<style>
  @page { margin: 16mm; }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .report__head {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #cccccc;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111111;
  }
  .report__title { margin: 0; font-size: 20px; }
  .report__stamp { font-size: 12px; color: #555555; }
  .builder__remove { display: none !important; }
  .builder__slot { break-inside: avoid; margin-bottom: 12px; }
</style></head>
<body>
  <div class="report__head">
    <h1 class="report__title">${title}</h1>
    <span class="report__stamp">${stamp} &middot; ${this.blocks().length} bileşen</span>
  </div>
  ${content}
</body></html>`;
  }
}
