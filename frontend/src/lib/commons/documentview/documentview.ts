import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Button } from '../button/button';

/** Belgeye giren sütun. */
export interface DocumentColumn {
  /** Satır nesnesinden okunacak alan adı. */
  field: string;
  /** Sütun başlığında yazan metin. */
  title: string;
  /** Hücre metnini biçimlendirir; verilmezse alanın kendisi yazılır. */
  format?: (row: any) => string;
}

/** Dışa aktarma biçimi. */
export type DocumentFormat = 'csv' | 'pdf';

/** Ekranın belgeye verdiği yapılandırma. */
export interface DocumentViewConfig {
  /** Belge başlığı; hem önizlemede hem çıktıda yazar. */
  title: string;
  /** İndirilen dosyanın adı, uzantısız. */
  fileName: string;
  /** Belgeye giren sütunlar, verildikleri sırayla. */
  columns: DocumentColumn[];
  /** Başlığın altındaki açıklama satırı. */
  description?: string;
  /** Sunulacak biçimler. Verilmezse ikisi de çıkar. */
  formats?: DocumentFormat[];
  /** Satır yokken yazılacak metin. */
  emptyText?: string;
}

/**
 * Belge önizleme ve dışa aktarma.
 *
 * Verilen satırları çıktıda görüneceği gibi beyaz bir sayfa üzerinde gösterir;
 * üstündeki butonlar aynı içeriği CSV olarak indirir ya da yazdırma penceresini
 * açarak PDF'e kaydettirir. Hangi sütunların gireceğini ve dosya adını ekran
 * config ile belirler.
 *
 * PDF için ayrı bir kütüphane kullanılmıyor; tarayıcının kendi "PDF olarak
 * kaydet" çıktısı yeterli olduğu için bağımlılık eklenmedi.
 */
@Component({
  selector: 'app-documentview',
  imports: [Button],
  templateUrl: './documentview.html',
  styleUrl: './documentview.scss',
})
export class Documentview extends BaseComponent {
  /** Başlık, sütunlar ve dosya adı. */
  readonly config = input<DocumentViewConfig>({ title: '', fileName: 'belge', columns: [] });

  /** Belgeye girecek satırlar. */
  readonly rows = input<any[]>([]);

  /** Yazdırılacak alan; çıktı bu düğümün içeriğinden üretilir. */
  private readonly page = viewChild.required<ElementRef<HTMLElement>>('page');

  readonly formats = computed<DocumentFormat[]>(() => this.config().formats ?? ['csv', 'pdf']);

  readonly emptyText = computed(() => this.config().emptyText ?? this.getResource('DOCUMENT_EMPTY', 'Kayıt yok'));

  /** Hücrede yazacak metin. */
  getText(column: DocumentColumn, row: any): string {
    return column.format ? column.format(row) : (row[column.field] ?? '');
  }

  /** Buton yazısı. */
  getFormatLabel(format: DocumentFormat): string {
    return format === 'csv'
      ? this.getResource('DOCUMENT_CSV', 'CSV indir')
      : this.getResource('DOCUMENT_PDF', 'PDF indir');
  }

  /** Seçilen biçimde dışa aktarır. */
  download(format: DocumentFormat) {
    format === 'csv' ? this.downloadCsv() : this.downloadPdf();
  }

  /**
   * CSV indirir. Başa BOM konuyor; yoksa Excel Türkçe karakterleri bozuyor.
   */
  private downloadCsv() {
    const columns = this.config().columns;
    const head = columns.map((column) => column.title).join(';');
    const body = this.rows().map((row) => columns.map((column) => this.getText(column, row)).join(';'));
    const content = '\ufeff' + [head, ...body].join('\r\n');

    const link = document.createElement('a');

    link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    link.download = `${this.config().fileName}.csv`;
    link.click();

    // Adres hemen serbest bırakılırsa tarayıcı indirmeyi yarıda kesiyor.
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  /**
   * Yazdırma penceresini açar, kullanıcı "PDF olarak kaydet" der.
   *
   * Yeni sekme yerine gizli bir iframe kullanılıyor; açılır pencere engelleyici
   * bunu durdurmuyor ve sayfadan çıkılmıyor.
   */
  private downloadPdf() {
    const frame = document.createElement('iframe');

    frame.setAttribute('style', 'position:fixed;width:0;height:0;border:0;');
    document.body.appendChild(frame);

    const win = frame.contentWindow;

    if (!win) {
      frame.remove();
      return;
    }

    win.document.write(this.getPrintHtml());
    win.document.close();
    win.focus();
    win.print();

    setTimeout(() => frame.remove(), 1000);
  }

  /** Çıktının kaynağı; önizlemede duran işaretlemenin aynısı. */
  private getPrintHtml(): string {
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>${this.config().fileName}</title>
<style>
  body { margin: 24px; font-family: system-ui, sans-serif; color: #111; }
  h3 { margin: 0 0 4px; font-size: 16px; }
  p { margin: 0 0 16px; color: #555; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 8px; border: 1px solid #ccc; text-align: left; }
  th { background: #f2f2f2; }
</style></head><body>${this.page().nativeElement.innerHTML}</body></html>`;
  }
}
