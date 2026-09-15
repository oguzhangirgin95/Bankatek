import { Component, computed, input } from '@angular/core';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { InfoVariant } from '../info/info';
import { Skeleton } from '../skeleton/skeleton';

/** Tablodaki bir sütun. */
export interface GenericListColumn {
  /** Satır nesnesinden okunacak alan adı. */
  field: string;
  /** Sütun başlığında yazan metin. */
  title: string;
  /** 'badge' verilirse hücre renkli etiket olarak çizilir. */
  type?: 'text' | 'badge';
  /** Etiket rengi. Satıra göre değişebildiği için fonksiyon alır. */
  variant?: (row: any) => InfoVariant;
  /** Hücre metnini biçimlendirir; verilmezse alanın kendisi yazılır. */
  format?: (row: any) => string;
}

/** Satır sonundaki işlem butonu. */
export interface GenericListAction {
  /** Butonu ayırt eden anahtar. */
  key: string;
  /** Buton yazısı. */
  label: string;
  /** Tıklanınca çalışacak metot. Ekran kendi işini burada yapar. */
  click: (row: any) => void;
  /** Buton görünümü. Verilmezse dolu (primary) çizilir. */
  variant?: FlowButtonVariant;
  /** Butonun o satırda görünüp görünmeyeceği. Verilmezse görünür. */
  visible?: (row: any) => boolean;
}

/** Ekranın listeye verdiği yapılandırma. */
export interface GenericListConfig {
  /** Listenin üstündeki başlık. Boşsa çizilmez. */
  title?: string;
  /** Sütunlar, verildikleri sırayla. */
  columns: GenericListColumn[];
  /** İşlem butonları. Boşsa işlem sütunu hiç açılmaz. */
  actions?: GenericListAction[];
  /** İşlem sütununun başlığı. */
  actionTitle?: string;
  /** Sonuç boşken gösterilecek metin. */
  emptyText?: string;
}

/**
 * Yapılandırma ile çizilen liste.
 *
 * Hangi sütunların, hangi işlem butonlarının çıkacağını ve butona basılınca
 * ne olacağını ekran belirler; bileşen yalnızca verilen config'i çizer ve
 * tıklanan butonun kendi metodunu çağırır. Kendi içinde veri çekmez ve durum
 * tutmaz, böylece her transaction aynı bileşeni kendi config'i ile kullanır.
 */
@Component({
  selector: 'app-genericlist',
  imports: [Badge, Button, Skeleton],
  templateUrl: './genericlist.html',
  styleUrl: './genericlist.scss',
})
export class Genericlist extends BaseComponent {
  /** Sütun ve buton tanımları. */
  readonly config = input<GenericListConfig>({ columns: [] });

  /** Satırlar. Sunucudan geldiği gibi verilir. */
  readonly rows = input<any[]>([]);

  /** İşlem sütunu yalnızca en az bir buton tanımlıysa çizilir. */
  readonly actions = computed(() => this.config().actions ?? []);

  /** Boş satırın kaç sütun boyunca uzayacağı. */
  readonly columnCount = computed(() => this.config().columns.length + (this.actions().length ? 1 : 0));

  /** İskelet çizerken dönülecek hücre indeksleri; değerlerin bir anlamı yok. */
  readonly cells = computed(() => Array.from({ length: this.columnCount() }, (value, index) => index));

  readonly actionTitle = computed(() => this.config().actionTitle ?? this.getResource('LIST_ACTION', 'İşlem'));

  readonly emptyText = computed(() => this.config().emptyText ?? this.getResource('LIST_EMPTY', 'Kayıt yok'));

  /** Hücrede yazacak metin. */
  getText(column: GenericListColumn, row: any): string {
    return column.format ? column.format(row) : (row[column.field] ?? '');
  }

  /** Etiket rengi; tanımlı değilse nötr renk kullanılır. */
  getVariant(column: GenericListColumn, row: any): InfoVariant {
    return column.variant ? column.variant(row) : 'info';
  }

  /** Buton bu satırda görünecek mi. */
  isVisible(action: GenericListAction, row: any): boolean {
    return action.visible ? action.visible(row) : true;
  }
}
