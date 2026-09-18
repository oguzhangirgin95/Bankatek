import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { NotificationItem } from '@lib/services/model/notificationItem';
import { Notification } from './notification';

@Component({
  imports: [Notification],
  template: `<app-notification />`,
})
class Host {}

const ITEMS: NotificationItem[] = [
  {
    id: 'NTF-001',
    title: 'Transfer onayınızı bekliyor',
    text: 'Anadolu Enerji A.Ş. alıcısına 12.450,00 TL',
    kind: 'transfer',
    date: '2026-09-15 16:42',
    read: false,
    path: '/transfers/transferlist/start',
  },
  {
    id: 'NTF-002',
    title: 'Rapor hazır',
    text: 'Ankara Müşteri raporu oluşturuldu',
    kind: 'report',
    date: '2026-09-15 13:05',
    read: false,
    path: '/reports/reportlist/start',
  },
  {
    id: 'NTF-003',
    title: 'Planlı bakım',
    text: 'FAST altyapısı pazar kapalı olacak',
    kind: 'system',
    date: '2026-09-14 17:22',
    read: false,
    path: '',
  },
  {
    id: 'NTF-004',
    title: 'Transfer tamamlandı',
    text: 'Marmara Lojistik Ltd. alıcısına 3.200,00 TL',
    kind: 'transfer',
    date: '2026-09-13 12:03',
    read: true,
    path: '/transfers/transferlist/start',
  },
];

describe('Notification', () => {
  let fixture: ComponentFixture<Host>;
  let controller: HttpTestingController;

  /**
   * Bileşen ilk cizimden sonra listeyi ceker; istek burada karsilanir.
   *
   * flush senkron, yaniti isleyen firstValueFrom ise mikro gorev; araya
   * whenStable girmezse sinyaller henuz yazilmamis olur.
   */
  const answer = async (items: NotificationItem[]): Promise<void> => {
    const unreadCount = items.filter((item) => item.read !== true).length;

    controller
      .expectOne((request) => request.url.endsWith('/notification/list'))
      .flush({ items, unreadCount, totalCount: items.length });

    await fixture.whenStable();
    fixture.detectChanges();
  };

  const button = (): HTMLButtonElement =>
    fixture.debugElement.query(By.css('.app-notification__button')).nativeElement;

  const badge = () => fixture.debugElement.query(By.css('.app-notification__badge'));

  const rows = () => fixture.debugElement.queryAll(By.css('.app-notification__item'));

  const openPanel = (): void => {
    button().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    // jsdom matchMedia tanimlamiyor; DeviceService ilk cizimden sonra onu okuyor.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }])],
    });

    fixture = TestBed.createComponent(Host);
    controller = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    // afterNextRender ilk cizimden sonra calisiyor; istek ancak bundan sonra atiliyor.
    await fixture.whenStable();
  });

  afterEach(() => controller.verify());

  it('rozet okunmamis sayisini yazar', async () => {
    await answer(ITEMS);

    expect(badge().nativeElement.textContent.trim()).toBe('3');
  });

  it('okunmamis yoksa rozet cizilmez', async () => {
    await answer(ITEMS.map((item) => ({ ...item, read: true })));

    expect(badge()).toBeNull();
  });

  it('dokuzdan buyuk sayi kisaltilir', async () => {
    await answer(
      Array.from({ length: 12 }, (_, index) => ({ ...ITEMS[0], id: `NTF-${index}`, read: false })),
    );

    expect(badge().nativeElement.textContent.trim()).toBe('9+');
  });

  it('butona basilinca liste acilir, tekrar basilinca kapanir', async () => {
    await answer(ITEMS);

    expect(fixture.debugElement.query(By.css('.app-notification__panel'))).toBeNull();

    openPanel();
    expect(rows().length).toBe(4);

    openPanel();
    expect(fixture.debugElement.query(By.css('.app-notification__panel'))).toBeNull();
  });

  it('okunmamis satir isaretlenir', async () => {
    await answer(ITEMS);
    openPanel();

    const unread = rows().map((row) => row.nativeElement.classList.contains('app-notification__item--unread'));

    expect(unread).toEqual([true, true, true, false]);
    expect(fixture.debugElement.queryAll(By.css('.app-notification__dot')).length).toBe(3);
  });

  it('ekrani olan satir okundu isaretlenir, panel kapanir', async () => {
    await answer(ITEMS);
    openPanel();

    rows()[1].nativeElement.click();

    const request = controller.expectOne((item) => item.url.endsWith('/notification/read'));
    expect(request.request.body).toEqual({ id: 'NTF-002' });

    request.flush({ success: true, unreadCount: 2, message: '' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(badge().nativeElement.textContent.trim()).toBe('2');
    expect(fixture.debugElement.query(By.css('.app-notification__panel'))).toBeNull();
  });

  it('gidilecek ekrani olmayan satirda panel acik kalir', async () => {
    await answer(ITEMS);
    openPanel();

    rows()[2].nativeElement.click();

    controller
      .expectOne((item) => item.url.endsWith('/notification/read'))
      .flush({ success: true, unreadCount: 2, message: '' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.app-notification__panel'))).not.toBeNull();
    expect(rows()[2].nativeElement.classList.contains('app-notification__item--unread')).toBe(false);
  });

  it('tumunu okundu isaretle rozeti kaldirir', async () => {
    await answer(ITEMS);
    openPanel();

    fixture.debugElement.query(By.css('.app-notification__readall')).nativeElement.click();

    const request = controller.expectOne((item) => item.url.endsWith('/notification/read'));
    expect(request.request.body).toEqual({ all: true });

    request.flush({ success: true, unreadCount: 0, message: '' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(badge()).toBeNull();
  });

  it('bos listede satir yerine aciklama cikar', async () => {
    await answer([]);
    openPanel();

    expect(rows().length).toBe(0);
    expect(fixture.debugElement.query(By.css('.app-notification__empty'))).not.toBeNull();
  });
});
