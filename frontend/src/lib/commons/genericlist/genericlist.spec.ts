import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { Genericlist, GenericListConfig } from './genericlist';

const CONFIG: GenericListConfig = {
  title: 'Şehirler',
  columns: [
    { field: 'name', title: 'Şehir' },
    { field: 'count', title: 'Transfer' },
  ],
  emptyText: 'Kayıt yok',
};

/** Alti satirlik deterministik veri. */
const ROWS = [
  { name: 'Ankara', count: 42 },
  { name: 'İstanbul', count: 35 },
  { name: 'İzmir', count: 23 },
  { name: 'Bursa', count: 18 },
  { name: 'Antalya', count: 14 },
  { name: 'Adana', count: 11 },
];

@Component({
  imports: [Genericlist],
  template: `
    <app-genericlist
      [config]="config()"
      [rows]="rows()"
      [pageSize]="pageSize()"
      [totalCount]="totalCount()"
      [(pageNumber)]="page"
    />
  `,
})
class Host {
  readonly config = signal<GenericListConfig>(CONFIG);
  readonly rows = signal<any[]>(ROWS);
  readonly pageSize = signal(0);
  readonly totalCount = signal(0);
  page = 1;
}

describe('Genericlist', () => {
  let fixture: ComponentFixture<Host>;

  const names = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('tbody tr td:first-child'))
      .map((element) => element.nativeElement.textContent.trim());

  const strip = () => fixture.debugElement.query(By.css('.app-pagination'));

  const info = (): string => fixture.debugElement.query(By.css('.app-pagination__info')).nativeElement.textContent.trim();

  /** Serideki sayfa numarasi butonuna basar. */
  const goPage = (page: number): void => {
    fixture.debugElement
      .queryAll(By.css('.app-pagination__button'))
      .find((button) => button.nativeElement.textContent.trim() === String(page))!
      .nativeElement.click();

    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('pageSize verilmezse serit cizilmez ve butun satirlar gorunur', () => {
    expect(strip()).toBeNull();
    expect(names()).toHaveLength(6);
  });

  it('pageSize verilince liste satirlari kendi boler', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.detectChanges();

    expect(names()).toEqual(['Ankara', 'İstanbul']);
    expect(strip()).not.toBeNull();
    expect(info()).toBe('1 - 2 / 6');
  });

  it('sayfa degisince gosterilen satirlar degisir ve disari bildirilir', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.detectChanges();

    goPage(3);

    expect(names()).toEqual(['Antalya', 'Adana']);
    expect(fixture.componentInstance.page).toBe(3);
    expect(info()).toBe('5 - 6 / 6');
  });

  it('totalCount verilince satirlar oldugu gibi cizilir', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.componentInstance.totalCount.set(120);
    fixture.componentInstance.rows.set(ROWS.slice(0, 2));
    fixture.detectChanges();

    expect(names()).toEqual(['Ankara', 'İstanbul']);
    expect(info()).toBe('1 - 2 / 120');
  });

  it('sunucu sayfalarken satir dilimlenmez', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.componentInstance.totalCount.set(6);
    fixture.detectChanges();

    // Ekran alti satiri birden verdiyse liste onlari kirpmaz; sayfalama onun isi.
    expect(names()).toHaveLength(6);
  });

  it('satir sayisi azalinca acik sayfa son sayfaya cekilir', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.detectChanges();

    goPage(3);
    expect(names()).toEqual(['Antalya', 'Adana']);

    fixture.componentInstance.rows.set(ROWS.slice(0, 3));
    fixture.detectChanges();

    expect(names()).toEqual(['İzmir']);
    expect(info()).toBe('3 - 3 / 3');
  });

  it('kayit yokken serit cizilmez, bos metin yazilir', () => {
    fixture.componentInstance.pageSize.set(2);
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();

    expect(strip()).toBeNull();
    expect(fixture.debugElement.query(By.css('tbody tr td')).nativeElement.textContent.trim()).toBe('Kayıt yok');
  });

  it('sutun basliklari ve bicimlendirme config ten gelir', () => {
    fixture.componentInstance.config.set({
      columns: [{ field: 'count', title: 'Adet', format: (row) => `${row.count} adet` }],
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('thead th')).nativeElement.textContent.trim()).toBe('Adet');
    expect(names()[0]).toBe('42 adet');
  });
});
