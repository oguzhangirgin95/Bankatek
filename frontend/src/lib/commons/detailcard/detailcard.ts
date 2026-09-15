import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Skeleton } from '../skeleton/skeleton';
import { ListItem } from '../list/list';

/**
 * Seçilen kaydın özeti: fotoğraf, başlık ve anahtar/değer satırları.
 *
 * Üç durumu vardır: veri geldiyse kaydı gösterir, istek sürüyorsa yükleniyor
 * iskeletini, hiçbiri yoksa "kayıt seçilmedi" metnini.
 */
@Component({
  selector: 'app-detailcard',
  imports: [Skeleton],
  templateUrl: './detailcard.html',
  styleUrl: './detailcard.scss',
})
export class Detailcard extends BaseComponent {
  /** Kaydın adı; genelde IBAN ya da kişinin adı. */
  readonly title = input<string>('');

  /** Başlığın altındaki açıklama, örneğin aracın marka ve modeli. */
  readonly subtitle = input<string>('');

  /** Fotoğraf adresi. Boş bırakılırsa görsel alanı hiç çizilmez. */
  readonly imageUrl = input<string>('');

  /** Alt alta listelenecek alanlar. */
  readonly items = input<ListItem[]>([]);

  /** Hiçbir kayıt seçilmemişken gösterilecek metin. */
  readonly emptyText = input<string>('Kayıt seçilmedi');
}
