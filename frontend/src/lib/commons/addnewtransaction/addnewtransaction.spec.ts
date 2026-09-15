import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { Addnewtransaction } from './addnewtransaction';

@Component({
  imports: [Addnewtransaction],
  template: `
    <app-addnewtransaction
      [lines]="lines()"
      [buttonLabel]="buttonLabel()"
      [icon]="icon()"
      [showIcon]="showIcon()"
      [variant]="variant()"
      [disabled]="disabled()"
      [accent]="accent()"
      (clicked)="clicks = clicks + 1"
    />
  `,
})
class Host {
  readonly lines = signal<string[]>(['yazı 1', 'yazı 2', 'yazı 3']);
  readonly buttonLabel = signal('Yeni Transfer');
  readonly icon = signal('transfer');
  readonly showIcon = signal(true);
  readonly variant = signal<FlowButtonVariant>('primary');
  readonly disabled = signal(false);
  readonly accent = signal(false);
  clicks = 0;
}

describe('Addnewtransaction', () => {
  let fixture: ComponentFixture<Host>;

  /** Soldaki metin satirlari. */
  const lineTexts = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-addnewtransaction__line'))
      .map((element) => element.nativeElement.textContent.trim());

  const button = (): HTMLButtonElement => fixture.debugElement.query(By.css('button')).nativeElement;

  const banner = (): HTMLElement => fixture.debugElement.query(By.css('.app-addnewtransaction')).nativeElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('verilen her satiri sirayla yazar', () => {
    expect(lineTexts()).toEqual(['yazı 1', 'yazı 2', 'yazı 3']);
  });

  it('satir sayisi serbesttir', () => {
    fixture.componentInstance.lines.set(['tek satır']);
    fixture.detectChanges();

    expect(lineTexts()).toEqual(['tek satır']);
  });

  it('bos satirlar elenir', () => {
    fixture.componentInstance.lines.set(['dolu', '', '   ']);
    fixture.detectChanges();

    expect(lineTexts()).toEqual(['dolu']);
  });

  it('hic satir yoksa metin blogu cizilmez', () => {
    fixture.componentInstance.lines.set([]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.app-addnewtransaction__lines'))).toBeNull();
    expect(button()).toBeTruthy();
  });

  it('buton yazisi proptan gelir', () => {
    expect(button().textContent?.trim()).toBe('Yeni Transfer');
  });

  it('ikon adina gore cizim degisir', () => {
    const withTransfer = fixture.debugElement.query(By.css('.app-addnewtransaction__icon path'))
      .nativeElement.getAttribute('d');

    fixture.componentInstance.icon.set('document');
    fixture.detectChanges();

    const withDocument = fixture.debugElement.query(By.css('.app-addnewtransaction__icon path'))
      .nativeElement.getAttribute('d');

    expect(withDocument).not.toBe(withTransfer);
  });

  it('taninmayan ikon adi yedege duser', () => {
    fixture.componentInstance.icon.set('plus');
    fixture.detectChanges();
    const fallback = fixture.debugElement.query(By.css('.app-addnewtransaction__icon path'))
      .nativeElement.getAttribute('d');

    fixture.componentInstance.icon.set('boyle-bir-ikon-yok');
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.app-addnewtransaction__icon path')).nativeElement.getAttribute('d'),
    ).toBe(fallback);
  });

  it('showIcon false verilince ikon cizilmez', () => {
    fixture.componentInstance.showIcon.set(false);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.app-addnewtransaction__icon'))).toBeNull();
  });

  it('tiklama disari yayilir', () => {
    button().click();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('pasif butonda tiklama yayilmaz', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    button().click();

    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('variant butona gecer', () => {
    fixture.componentInstance.variant.set('outline');
    fixture.detectChanges();

    expect(button().classList.contains('app-button--outline')).toBe(true);
  });

  it('accent verilince kenarlik modul rengini alir', () => {
    expect(banner().classList.contains('app-addnewtransaction--accent')).toBe(false);

    fixture.componentInstance.accent.set(true);
    fixture.detectChanges();

    expect(banner().classList.contains('app-addnewtransaction--accent')).toBe(true);
  });
});
