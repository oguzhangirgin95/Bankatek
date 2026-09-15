import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { TourStepConfig } from '@lib/base/baseconfig/config';
import { FlowService } from '@lib/base/baseservice/flowservice';
import { TourService } from '@lib/base/baseservice/tourservice';
import { Tour } from './tour';

/**
 * Tanıtım turunun davranış testleri. jsdom düzen hesaplamadığı için hedefin
 * ölçüsü elle taklit ediliyor; testin konusu ölçüm değil, hangi durakta
 * olunduğu ve neyin saklandığı.
 */

/** Ölçüsü olan bir hedef ekler; ölçüsü sıfır olan eleman yok sayılıyor. */
function addTarget(id: string): void {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = () =>
    ({ top: 100, left: 50, width: 200, height: 40, right: 250, bottom: 140, x: 50, y: 100, toJSON: () => '' }) as DOMRect;

  document.body.appendChild(element);
}

const STEPS: TourStepConfig[] = [
  { id: 'cityId', title: 'İlk durak', text: 'Birinci açıklama' },
  { id: 'dashboardStats', title: 'İkinci durak', text: 'İkinci açıklama' },
];

describe('Tanıtım turu', () => {
  let fixture: ComponentFixture<Tour>;
  let tourService: TourService;
  let flowService: FlowService;

  beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    Element.prototype.scrollIntoView = () => {};

    TestBed.configureTestingModule({
      imports: [Tour],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    tourService = TestBed.inject(TourService);
    flowService = TestBed.inject(FlowService);

    fixture = TestBed.createComponent(Tour);
    await fixture.whenStable();
  });

  /** Ekranı açar: hedefleri DOM'a koyar, yapılandırmayı FlowService'e yazar. */
  const open = async (transaction: string, tour: TourStepConfig[], targets = tour.map((step) => step.id)) => {
    targets.forEach(addTarget);

    flowService.config.set({ config: { steps: [{ step: 'start', validation: [], tour }] } });
    flowService.transaction.set(transaction);
    flowService.currentStep.set('start');

    await fixture.whenStable();
  };

  const html = () => fixture.nativeElement as HTMLElement;

  const text = (selector: string) => html().querySelector(selector)?.textContent?.trim() ?? '';

  const click = async (selector: string) => {
    (html().querySelector(selector) as HTMLButtonElement).click();
    await fixture.whenStable();
  };

  /** Başka ekrana gidip döner; turun yeniden kurulmasını tetikler. */
  const leaveAndReturn = async (transaction: string) => {
    flowService.transaction.set('transfers/transferlist');
    await fixture.whenStable();
    flowService.transaction.set(transaction);
    await fixture.whenStable();
  };

  it('yapılandırmada tur yoksa hiçbir şey çizilmez', async () => {
    await open('monitoring/dashboard', []);

    expect(html().querySelector('.app-tour')).toBeNull();
  });

  it('ilk durak başlığı, metni ve sayacı ile açılır', async () => {
    await open('monitoring/dashboard', STEPS);

    expect(text('.app-tour__title')).toBe('İlk durak');
    expect(text('.app-tour__text')).toBe('Birinci açıklama');
    expect(text('.app-tour__count')).toBe('1 / 2');
  });

  it('İleri sonraki durağa geçirir, son durakta yazı Bitir olur', async () => {
    await open('monitoring/dashboard', STEPS);

    await click('.app-tour__foot button:last-child');

    expect(text('.app-tour__title')).toBe('İkinci durak');
    expect(text('.app-tour__foot button:last-child')).toBe('Bitir');
  });

  it('Geri önceki durağa döner', async () => {
    await open('monitoring/dashboard', STEPS);
    await click('.app-tour__foot button:last-child');

    await click('.app-tour__back');

    expect(text('.app-tour__count')).toBe('1 / 2');
  });

  it('tur bitince kapanır ve aynı ekrana dönüldüğünde açılmaz', async () => {
    await open('monitoring/dashboard', STEPS);
    await click('.app-tour__foot button:last-child');
    await click('.app-tour__foot button:last-child');

    expect(html().querySelector('.app-tour')).toBeNull();

    await leaveAndReturn('monitoring/dashboard');

    expect(html().querySelector('.app-tour')).toBeNull();
  });


  it('"gizle" bütün ekranlarda turu kapatır', async () => {
    await open('monitoring/dashboard', STEPS);

    await click('.app-tour__hide');

    expect(html().querySelector('.app-tour')).toBeNull();

    await open('transfers/transferlist', [{ id: 'searchText', title: 'Başka', text: 'Başka ekran' }]);

    expect(html().querySelector('.app-tour')).toBeNull();
  });

  it('sıfırlama ipuçlarını yeniden açar', async () => {
    await open('monitoring/dashboard', STEPS);
    await click('.app-tour__hide');

    tourService.reset();
    await fixture.whenStable();

    expect(text('.app-tour__title')).toBe('İlk durak');
  });

  it("metinler 'ANAHTAR|varsayılan' biçimini çözer", async () => {
    await open('monitoring/dashboard', [
      { id: 'cityId', title: 'TOUR_X_TITLE|Kaynaksız başlık', text: 'TOUR_X_TEXT|Kaynaksız metin' },
    ]);

    expect(text('.app-tour__title')).toBe('Kaynaksız başlık');
    expect(text('.app-tour__text')).toBe('Kaynaksız metin');
  });

  it('hedef bulununca ışık ölçülen yere çizilir', async () => {
    await open('monitoring/dashboard', STEPS);

    const hole = html().querySelector('.app-tour__hole') as HTMLElement;

    // Kenar payı 8: 100-8 = 92, 50-8 = 42.
    expect(hole.style.top).toBe('92px');
    expect(hole.style.left).toBe('42px');
    expect(hole.style.width).toBe('216px');
  });

  it('position verilmezse hedefin yerine göre seçilir', async () => {
    // Hedef üst yarıda (top 100, innerHeight 768) olduğu için balon altına konar.
    await open('monitoring/dashboard', STEPS);

    const card = html().querySelector('.app-tour__card') as HTMLElement;

    expect(card.classList.contains('app-tour__card--top')).toBe(false);
    // Işığın altı 148, boşluk 14.
    expect(card.style.top).toBe('162px');
  });

  it('position verilirse balon o yöne konur', async () => {
    await open('monitoring/dashboard', [
      { id: 'cityId', title: 'Sağda', text: 'Sağda dursun', position: 'right' },
    ]);

    const card = html().querySelector('.app-tour__card') as HTMLElement;

    // Işığın sağı 258, boşluk 14.
    expect(card.style.left).toBe('272px');
    expect(card.style.top).toBe('92px');
  });

  it('sol yönde balon kendi genişliği kadar geri kaydırılır', async () => {
    await open('monitoring/dashboard', [
      { id: 'cityId', title: 'Solda', text: 'Solda dursun', position: 'left' },
    ]);

    const card = html().querySelector('.app-tour__card') as HTMLElement;

    expect(card.classList.contains('app-tour__card--left')).toBe(true);
  });

  it('hedef yokken balon açık kalır, İleri yine çalışır', async () => {
    await open('monitoring/dashboard', STEPS, []);

    expect(html().querySelector('.app-tour')).not.toBeNull();
    expect(html().querySelector('.app-tour__hole')).toBeNull();

    await click('.app-tour__foot button:last-child');

    expect(text('.app-tour__count')).toBe('2 / 2');
  });

  it('Escape turu kapatır', async () => {
    await open('monitoring/dashboard', STEPS);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(html().querySelector('.app-tour')).toBeNull();
  });
});
