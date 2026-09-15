import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Search, SearchResult } from './search';

const RESULTS: SearchResult[] = [
  { key: '06', text: 'Ankara', hint: '42 transfer' },
  { key: '34', text: 'İstanbul' },
];

@Component({
  imports: [FormsModule, Search],
  template: `
    <app-search
      id="q"
      [results]="results()"
      [minLength]="minLength()"
      [(ngModel)]="text"
      (searched)="queries.push($event)"
      (selected)="picked.set($event)"
      (cleared)="cleares = cleares + 1"
    />
  `,
})
class Host {
  readonly results = signal<SearchResult[]>([]);
  readonly minLength = signal(1);
  readonly picked = signal<SearchResult | undefined>(undefined);
  readonly queries: string[] = [];
  text = '';
  cleares = 0;
}

describe('Search', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  function field(): HTMLInputElement {
    return fixture.debugElement.query(By.css('.app-search__field')).nativeElement;
  }

  function write(value: string): void {
    const element = field();

    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => vi.useRealTimers());

  it('her tus vurusunda arama yapilmaz, yazma bitince bir kez aranir', () => {
    write('an');
    write('ank');
    write('anka');

    expect(host.queries).toEqual([]);

    vi.advanceTimersByTime(300);

    expect(host.queries).toEqual(['anka']);
  });

  it('deger ngModel e aninda yazilir', () => {
    write('ankara');

    expect(host.text).toBe('ankara');
  });

  it('enter beklemeyi iptal edip hemen arar', () => {
    write('ank');
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(host.queries).toEqual(['ank']);

    vi.advanceTimersByTime(300);

    expect(host.queries).toEqual(['ank']);
  });

  it('esik altindaki metin aranmaz', () => {
    host.minLength.set(3);
    fixture.detectChanges();

    write('an');
    vi.advanceTimersByTime(300);

    expect(host.queries).toEqual([]);

    write('ank');
    vi.advanceTimersByTime(300);

    expect(host.queries).toEqual(['ank']);
  });

  it('temizleme bos metni bildirir ve cleared cikisini tetikler', () => {
    write('ankara');
    vi.advanceTimersByTime(300);

    fixture.debugElement.query(By.css('.app-search__clear')).nativeElement.click();
    fixture.detectChanges();

    expect(host.text).toBe('');
    expect(host.queries).toEqual(['ankara', '']);
    expect(host.cleares).toBe(1);
  });

  it('sonuc listesi yalnizca yazarken acilir', () => {
    host.results.set(RESULTS);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.app-search__list'))).toBeNull();

    write('an');

    expect(fixture.debugElement.queryAll(By.css('.app-search__result')).length).toBe(2);
  });

  it('sonuc secilince metin dolar ve liste kapanir', () => {
    host.results.set(RESULTS);
    fixture.detectChanges();
    write('an');

    fixture.debugElement.queryAll(By.css('.app-search__result'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(host.picked()?.key).toBe('06');
    expect(host.text).toBe('Ankara');
    expect(fixture.debugElement.query(By.css('.app-search__list'))).toBeNull();
  });

  it('sonuc yokken bos metin gosterilir', () => {
    write('xyz');

    expect(fixture.debugElement.query(By.css('.app-search__empty'))).toBeTruthy();
  });

  it('escape alani temizler', () => {
    write('ankara');
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(host.text).toBe('');
  });
});
