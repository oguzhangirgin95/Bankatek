import { Component, computed, input, model } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Sayfalama şeridi.
 *
 * Sayfa numarası iki yönlü bağlanır: `[(pageNumber)]="State.Request.pageNumber"`.
 * Sayfa değişince liste yeniden çekileceği için ekranlar tek yön bağlayıp
 * (pageNumberChange) dinler; alan bileşenlerindeki ngModel düzeniyle aynı.
 *
 * Hangi sayfada olduğunu kendi tutmaz, her zaman bağlanan değerden okur.
 * Böylece sayfa numarası tek yerde, ekranın isteğinde durur.
 */
@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination extends BaseComponent {
  /** Filtreye uyan toplam kayıt sayısı; sayfadaki kayıt sayısı değil. */
  readonly totalCount = input<number>(0);

  /** Görüntülenen sayfa, 1'den başlar. Sayfaya tıklanınca buradan geri yazılır. */
  readonly pageNumber = model<number>(1);

  /** Sayfa başına kayıt. Toplam sayfa sayısı buradan hesaplanır. */
  readonly pageSize = input<number>(20);

  /** Toplam sayfa sayısı. Hiç kayıt yokken bile en az bir sayfa vardır. */
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  /**
   * Geçerli sayfanın çevresindeki en fazla beş sayfa numarası.
   *
   * Pencere normalde geçerli sayfayı ortalar; başa ya da sona yaklaşıldığında
   * kaydırılır ki düğme sayısı azalmasın ve şerit daralıp genişlemesin.
   */
  readonly pages = computed(() => {
    const first = Math.max(1, Math.min(this.pageNumber() - 2, this.pageCount() - 4));
    const last = Math.min(this.pageCount(), first + 4);

    const list: number[] = [];
    for (let page = first; page <= last; page++) {
      list.push(page);
    }
    return list;
  });

  /** "1 - 20 / 276" biçiminde özet. Kayıt yoksa bunun yerine bilgi metni döner. */
  readonly info = computed(() => {
    const from = (this.pageNumber() - 1) * this.pageSize() + 1;
    const to = Math.min(this.pageNumber() * this.pageSize(), this.totalCount());

    return this.totalCount() === 0
      ? this.getResource('PAGE_EMPTY', 'Kayıt yok')
      : `${from} - ${to} / ${this.totalCount()}`;
  });

  /**
   * Sayfa değiştirme isteği. Sınırların dışına çıkan ya da zaten açık olan
   * sayfayı isteyen tıklamalar gereksiz servis çağrısı olmasın diye yutulur.
   */
  go(page: number): void {
    if (page >= 1 && page <= this.pageCount() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
    }
  }
}
