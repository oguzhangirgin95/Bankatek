import { Component, input, model } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Tek bir sekme başlığı. */
export interface TabItem {
  /** Aktif sekmeyi belirlemekte kullanılan kimlik. */
  id: string;
  /** Sekmenin üzerinde yazan metin. */
  title: string;
}

/**
 * Sekme başlık şeridi.
 *
 * Yalnızca hangi sekmenin seçildiğini bildirir; içeriği kendisi barındırmaz.
 * Hangi sekmede ne gösterileceğine çağıran ekran karar verir.
 *
 * Aktif sekme iki yönlü bağlanır: `[(active)]="State.ActiveTab"`. Bir form
 * alanı olmadığı için ngModel yerine sinyal tabanlı model() kullanılıyor.
 */
@Component({
  selector: 'app-tabs',
  imports: [],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs extends BaseComponent {
  /** Gösterilecek sekmeler, soldan sağa bu sırayla çizilir. */
  readonly tabs = input<TabItem[]>([]);

  /** Aktif sekmenin id'si. Sekmeye tıklanınca buradan geri yazılır. */
  readonly active = model<string>('');
}
