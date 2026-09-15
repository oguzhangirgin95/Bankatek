import { Component, DOCUMENT, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Modül altındaki tek bir ekran. */
interface MenuTransaction {
  /** Gidilecek adres. */
  path: string;
  /** Menüde görünen ad. */
  text: string;
}

/** Menüdeki üst seviye başlık ve altındaki ekranlar. */
interface MenuModule {
  /** Modül kodu; hem kaynak anahtarı hem de açık modülü ayırt etmek için kullanılır. */
  code: string;
  /** Menüde görünen başlık. */
  text: string;
  /** Modülün altındaki ekranlar, gösterilecek sırayla. */
  transactions: MenuTransaction[];
}

/**
 * Ana gezinme menüsü. İçeriği sabit değil, sunucudan gelir (FlowService.menu),
 * dolayısıyla kullanıcının yetkisine göre değişebilir.
 *
 * Geniş ekranda şerit, dar ekranda çekmece olarak çalışır; Escape ikisini de
 * kapatır.
 */

/** Modul koduna gore ikon; sunucudan ikon gelmedigi icin burada eslesiyor. */
const ICONS: Record<string, string> = {
  MENU_MONITORING: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  MENU_CUSTOMERS: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.9',
  MENU_ACCOUNTS: 'M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M5 17H3v-5l2-5h9l4 5h3v5h-2',
  MENU_TRANSFERS: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  MENU_REGIONS: 'M9 4 3 7v13l6-3 6 3 6-3V4l-6 3zM9 4v13M15 7v13',
  MENU_BRANCHES: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6',
  MENU_REPORTS: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  MENU_ANALYTICS: 'M4 20V10M10 20V4M16 20v-7M2 20h20',
  MENU_SETTINGS: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1',
};

/** Karsiligi olmayan modul icin kullanilan yedek ikon. */
const FALLBACK_ICON = 'M4 6h16M4 12h16M4 18h16';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  host: {
    '(document:keydown.escape)': 'closeAll()',
  },
})
export class Menu extends BaseComponent {
  private readonly router = inject(Router);

  private readonly document = inject(DOCUMENT);

  /** Hiçbir modül açık değilken gösterilen başlık. */
  readonly title = computed(() => this.getResource('MENU_TITLE', 'Menü'));

  /**
   * Modüller ve altlarındaki ekranlar.
   *
   * Başlıklar kaynak anahtarlarıyla çevrilir; karşılığı yoksa sunucunun
   * gönderdiği metin olduğu gibi kullanılır.
   */
  readonly modules = computed<MenuModule[]>(() =>
    this.flowService.menu().map((module) => ({
      code: module.code ?? '',
      text: this.getResource(module.code ?? '', module.title ?? ''),
      transactions: (module.children ?? []).map((transaction) => ({
        path: transaction.path ?? '',
        text: this.getResource(transaction.code ?? '', transaction.title ?? ''),
      })),
    })),
  );

  /** Dar ekranda çekmecenin açık olup olmadığı. */
  readonly drawerOpen = signal(false);

  /** Açık olan modülün kodu. Boş metin "hiçbiri açık değil" demek. */
  readonly openCode = signal('');

  /** Bulunduğumuz ekranı içeren modül. */
  readonly activeModule = computed(
    () => this.modules().find((module) => module.transactions.some((item) => this.isActive(item.path))),
  );

  /** Dar ekranda başlık yerine, içinde bulunduğumuz modülün adı gösterilir. */
  readonly activeText = computed(() => this.activeModule()?.text ?? this.title());

  /** Menü içeriğini yükler ve çekmece açıkken gövde sınıfını yönetir. */
  constructor() {
    super();
    this.flowService.loadMenu();

    // Çekmece açıkken arkadaki sayfa kaymasın diye gövdeye sınıf eklenir.
    effect(() => this.document.body.classList.toggle('app-menu-open', this.drawerOpen()));

    // Çekmece açıkken menü yok edilirse sınıf gövdede asılı kalır ve bütün
    // uygulamada kaydırma kilitli kalırdı; temizleniyor.
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('app-menu-open'));
  }

  /** Modülün ikon çizimi; dar menüde yalnızca bu görünür. */
  icon(code: string): string {
    return ICONS[code] ?? FALLBACK_ICON;
  }

  /** Verilen adres şu an açık olan ekran mı. */
  isActive(path: string): boolean {
    return this.flowService.url() === path;
  }

  /** Modül, içinde bulunduğumuz ekranı barındırıyor mu. */
  isModuleActive(module: MenuModule): boolean {
    return this.activeModule()?.code === module.code;
  }

  /** Dar ekrandaki çekmeceyi açar ya da kapatır. */
  toggleDrawer(): void {
    this.drawerOpen.update((value) => !value);
    this.openCode.set('');
  }

  /**
   * Modülü açar; aynı modüle tekrar basılırsa kapatır. Tek bir kod tutulduğu
   * için aynı anda yalnızca bir modül açık kalır.
   */
  toggleModule(module: MenuModule): void {
    this.openCode.update((code) => (code === module.code ? '' : module.code));
  }

  /** Açık olan her şeyi kapatır. Escape ve gezinme sonrası çağrılır. */
  closeAll(): void {
    this.openCode.set('');
    this.drawerOpen.set(false);
  }

  /** Ekrana gider ve arkasından menüyü kapatır. */
  go(path: string): void {
    this.closeAll();
    this.router.navigateByUrl(path);
  }
}
