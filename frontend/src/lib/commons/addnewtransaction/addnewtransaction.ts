import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Button } from '../button/button';

/** Butondaki ikon adi; sidebar ve menudeki gibi ad -> cizim eslemesi. */
const ICONS: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  transfer: 'M3 8h14l-4-4M21 16H7l4 4',
  document: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  user: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4',
  upload: 'M12 19V5M5 12l7-7 7 7',
};

/** Karsiligi olmayan ad icin kullanilan yedek ikon. */
const FALLBACK_ICON = ICONS['plus'];

/**
 * Yeni işlem başlatmaya çağıran şerit.
 *
 * Solda alt alta duran metin satırları, sağda ikonlu bir buton bulunur.
 * İçeriğin tamamı prop ile verilir; bileşenin kendi metni yoktur, dolayısıyla
 * "yeni transfer", "yeni rapor" gibi her akışın başında kullanılabilir.
 *
 * Satır sayısı serbesttir: verilen her satır aynı biçimde alt alta yazılır,
 * boş olanlar elenir.
 */
@Component({
  selector: 'app-addnewtransaction',
  imports: [Button],
  templateUrl: './addnewtransaction.html',
  styleUrl: './addnewtransaction.scss',
})
export class Addnewtransaction extends BaseComponent {
  /** Solda alt alta gösterilecek metin satırları. */
  readonly lines = input<string[]>([]);

  /** Butonun yazısı. Boş bırakılırsa butonda yalnızca ikon kalır. */
  readonly buttonLabel = input<string>('');

  /** Butondaki ikonun adı. Tanınmayan ad artı işaretine düşer. */
  readonly icon = input<string>('plus');

  /** İkon gösterilsin mi. */
  readonly showIcon = input(true, { transform: booleanAttribute });

  /** Buton görünümü; Button bileşenindeki değerlerin aynısı. */
  readonly variant = input<FlowButtonVariant>('primary');

  /** Pasif butonda tıklama yayılmaz. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Şeridin kenarlığı içinde bulunulan modülün rengini alsın mı. */
  readonly accent = input(false, { transform: booleanAttribute });

  /** Butona tıklandı. */
  readonly clicked = output<void>();

  /** Gösterilecek satırlar; boş verilenler şeritte yer kaplamasın diye elenir. */
  protected readonly visibleLines = computed(() =>
    this.lines().filter((line) => (line ?? '').trim() !== ''),
  );

  /** İkonun çizimi. */
  protected readonly iconPath = computed(() => ICONS[this.icon()] ?? FALLBACK_ICON);
}
