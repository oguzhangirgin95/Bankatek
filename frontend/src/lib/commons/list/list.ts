import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Skeleton } from '../skeleton/skeleton';

/** Anahtar/değer satırı. Detay kartı da aynı tipi kullanır. */
export interface ListItem {
  /** Soldaki etiket, örneğin "IBAN". */
  key: string;
  /** Sağdaki değer. Sayı da metin de olabildiği için tipi serbest bırakıldı. */
  value: any;
}

/**
 * Anahtar/değer listesi. Tek bir kaydın alanlarını alt alta gösterir;
 * tabloya gerek olmayan detay görünümleri için.
 */
@Component({
  selector: 'app-list',
  imports: [Skeleton],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List extends BaseComponent {
  /** Listenin üstündeki başlık. Boşsa çizilmez. */
  readonly title = input<string>('');

  /** Gösterilecek satırlar, verildikleri sırayla. */
  readonly items = input<ListItem[]>([]);

  /** Liste boşken gösterilecek metin. */
  readonly emptyText = input<string>('Kayıt yok');
}
