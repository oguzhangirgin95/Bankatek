import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { NotificationControllerService } from '@lib/services/api/notificationController.service';
import { NotificationItem } from '@lib/services/model/notificationItem';

/** Bildirim türüne göre çizim; sidebar ve profilemenu'deki gibi ad -> çizim eşlemesi. */
const ICONS: Record<string, string> = {
  transfer: 'M3 8h14l-4-4M21 16H7l4 4',
  report: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  limit: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
  system: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 8v4M12 16h.01',
};

/** Tanınmayan tür için yedek çizim. */
const FALLBACK_ICON = ICONS['system'];

/** Rozette yazılabilecek en büyük sayı; üstü '9+' olarak kısalır. */
const MAX_BADGE = 9;

/**
 * Üst şeritteki bildirim menüsü.
 *
 * Zil butonu okunmamış sayısını rozetle gösterir, tıklanınca liste açılır.
 * Kayıtlar sunucudan gelir; bir bildirime tıklamak onu okundu işaretler ve
 * varsa ilgili ekrana götürür, böylece bildirim bir bilgi değil kısayol olur.
 *
 * Okundu işaretleme önce yerelde yapılıp sonra sunucuya gidiyor: liste zaten
 * açık ve kullanıcı satırın sönmesini beklemeden okumaya devam ediyor. Sunucu
 * yanıtındaki sayı üzerine yazıyor, ikisi ayrışırsa sunucununki geçerli.
 */
@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class Notification extends BaseComponent {
  private readonly notificationService = inject(NotificationControllerService);

  /** Listedeki bildirimler, en yeniden en eskiye. */
  protected readonly items = signal<NotificationItem[]>([]);

  /** Okunmamış bildirim sayısı; rozet bunu okur. */
  protected readonly unread = signal(0);

  /** Liste açık mı. */
  protected readonly open = signal(false);

  /** Ekran metinleri. */
  protected readonly labels = computed(() => ({
    title: this.getResource('NOTIFICATION_TITLE', 'Bildirimler'),
    readAll: this.getResource('NOTIFICATION_READALL', 'Tümünü okundu işaretle'),
    empty: this.getResource('NOTIFICATION_EMPTY', 'Bildiriminiz yok'),
    unread: this.getResource('NOTIFICATION_UNREAD', 'okunmamış'),
  }));

  /** Rozetin yazısı. Sayı büyüdükçe rozet büyümesin diye üstü kısaltılır. */
  protected readonly badge = computed(() => (this.unread() > MAX_BADGE ? `${MAX_BADGE}+` : String(this.unread())));

  /**
   * Bildirimler ilk çizimden sonra yükleniyor.
   *
   * Sunucu tarafında oturum bilinmediği için liste orada boştur; istek
   * tarayıcı devraldıktan sonra atılırsa sunucunun ürettiği HTML ile ilk çizim
   * aynı kalır ve hidrasyon uyuşmazlığı çıkmaz.
   */
  constructor() {
    super();
    afterNextRender(() => this.load());
  }

  /** Türün çizimi. */
  protected icon(kind: string): string {
    return ICONS[kind] ?? FALLBACK_ICON;
  }

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Listeyi sunucudan çeker. */
  private load(): void {
    firstValueFrom(this.notificationService.notificationList({}))
      .then((response) => {
        this.items.set(response?.items ?? []);
        this.unread.set(response?.unreadCount ?? 0);
      })
      .catch((error) => console.error('Notification list:', error));
  }

  /**
   * Bildirime tıklandı: okundu işaretlenir ve tanımlıysa ilgili ekrana gidilir.
   *
   * Duyuru gibi gidilecek ekranı olmayan bildirimlerde yalnızca okundu
   * işaretlenir, liste de kapanmaz; kullanıcı okumaya devam edebilsin.
   */
  protected choose(item: NotificationItem): void {
    if (item.read !== true) {
      this.markRead(item.id ?? '');
    }

    if (item.path) {
      this.close();
      this.navigate(item.path);
    }
  }

  /** Tek bir bildirimi okundu işaretler. */
  private markRead(id: string): void {
    this.items.update((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
    this.unread.update((count) => Math.max(0, count - 1));

    firstValueFrom(this.notificationService.notificationRead({ id }))
      .then((response) => this.unread.set(response?.unreadCount ?? 0))
      .catch((error) => console.error('Notification read:', error));
  }

  /** Listenin tamamını okundu işaretler. */
  protected readAll(): void {
    this.items.update((items) => items.map((item) => ({ ...item, read: true })));
    this.unread.set(0);

    firstValueFrom(this.notificationService.notificationRead({ all: true }))
      .then((response) => this.unread.set(response?.unreadCount ?? 0))
      .catch((error) => console.error('Notification read all:', error));
  }
}
