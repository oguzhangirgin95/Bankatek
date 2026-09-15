import { Component, booleanAttribute, input, output } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Skeleton } from '../skeleton/skeleton';

/** Tablo sütunu. */
export interface GridColumn {
  /** Satır nesnesinden okunacak alan adı. */
  field: string;
  /** Sütun başlığında yazan metin. */
  title: string;
}

/**
 * Sade veri tablosu.
 *
 * Sıralama ve sayfalama içermez. Veriler sunucudan sayfa sayfa geldiği için
 * bu işleri çağıran ekran yapar ve buraya yalnızca gösterilecek satırları
 * verir; tablonun kendi içinde tutacağı bir durum yoktur.
 */
@Component({
  selector: 'app-grid',
  imports: [Skeleton],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class Grid extends BaseComponent {
  /** Tablonun üstündeki başlık. Boşsa çizilmez. */
  readonly title = input<string>('');

  /** Hangi alanların hangi başlıkla gösterileceği. */
  readonly columns = input<GridColumn[]>([]);

  /** Satırlar. Sütunlardaki field adlarıyla eşleşen alanlar okunur. */
  readonly rows = input<any[]>([]);

  /** Sonuç boşken gösterilecek metin. */
  readonly emptyText = input<string>('Kayıt yok');

  /** Satırların tıklanabilir olup olmadığı; imleci ve vurguyu da bu belirler. */
  readonly clickable = input(false, { transform: booleanAttribute });

  /** Tıklanan satırın kendisi. Ekran genelde detay açmak için kullanır. */
  readonly rowClicked = output<any>();
}
