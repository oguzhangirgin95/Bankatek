import { Component, computed, input, model, numberAttribute } from '@angular/core';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { InfoVariant } from '../info/info';
import { Pagination } from '../pagination/pagination';
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
 * tıklanan butonun kendi metodunu çağırır. Kendi içinde veri çekmez, böylece
 * her transaction aynı bileşeni kendi config'i ile kullanır.
 *
 * Sayfalama şeridi listenin içindedir: `pageSize` verildiğinde tablonun altına
 * kendiliğinden çizilir, ekranın ayrıca app-pagination yerleştirmesi gerekmez.
 * İki türlü çalışır ve hangisinin geçerli olduğunu `totalCount` belirler:
 *
 * - `totalCount` verilirse satırların sunucuda sayfalandığı varsayılır; liste
 *   eline geleni çizer, sayfa değişimini `pageNumber` ile ekrana bildirir.
 * - `totalCount` verilmezse liste elindeki satırları kendi böler; verinin
 *   tamamı zaten bellekte olan küçük listeler için ekranın dilimleme kodu
 *   yazmasına gerek kalmaz.
 */
@Component({
  selector: 'app-genericlist',
  imports: [Badge, Button, Pagination, Skeleton],
  templateUrl: './genericlist.html',
  styleUrl: './genericlist.scss',
})
export class Genericlist extends BaseComponent {
  /** Sütun ve buton tanımları. */
  readonly config = input<GenericListConfig>({ columns: [] });

  /** Satırlar. Sunucudan geldiği gibi verilir. */
  readonly rows = input<any[]>([]);

  /** Sayfa başına kayıt. 0 verilirse sayfalama şeridi hiç çizilmez. */
  readonly pageSize = input(0, { transform: numberAttribute });

  /**
   * Filtreye uyan toplam kayıt sayısı; sayfadaki kayıt sayısı değil.
   *
   * Verilmesi aynı zamanda "satırları ben sayfaladım" demektir; verilmezse
   * bölme işini liste üstlenir.
   */
  readonly totalCount = input(0, { transform: numberAttribute });

  /** Görüntülenen sayfa, 1'den başlar. Sayfaya tıklanınca buradan geri yazılır. */
  readonly pageNumber = model<number>(1);

  /** Sayfalama şeridi çizilecek mi. */
  readonly paged = computed<boolean>(() => this.pageSize() > 0);

  /** Satırları listenin kendisi mi bölüyor. */
  private readonly clientPaged = computed<boolean>(() => this.paged() && this.totalCount() <= 0);

  /** Şeride yazılan toplam: sunucu sayfalıyorsa onun sayısı, değilse elimizdeki satırlar. */
  readonly total = computed<number>(() => (this.clientPaged() ? this.rows().length : this.totalCount()));

  /**
   * Şeride verilen sayfa.
   *
   * Liste kendi böldüğünde satır sayısı azalabiliyor (filtre daralınca) ve açık
   * sayfa listenin dışında kalabiliyor; boş sayfa göstermek yerine son sayfaya
   * çekiliyor. Sunucu sayfaladığında sayfanın sahibi ekran, ona karışılmıyor.
   */
  readonly activePage = computed<number>(() => {
    if (!this.clientPaged()) {
      return this.pageNumber();
    }

    return Math.min(this.pageNumber(), Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  });

  /** Ekrana çizilen satırlar. Sunucu sayfaladığında satırların tamamı çizilir. */
  readonly visibleRows = computed<any[]>(() => {
    if (!this.clientPaged()) {
      return this.rows();
    }

    const start = (this.activePage() - 1) * this.pageSize();

    return this.rows().slice(start, start + this.pageSize());
  });

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
