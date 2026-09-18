import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { FlowService } from '@lib/base/baseservice/flowservice';
import { Step, StepItem } from './step';

@Component({
  imports: [Step],
  template: `<app-step [steps]="steps()" [active]="active()" />`,
})
class Host {
  readonly steps = signal<StepItem[]>([
    { id: 'form', title: 'Bilgiler' },
    { id: 'confirm', title: 'Onay' },
    { id: 'result', title: 'Sonuç' },
  ]);
  readonly active = signal('confirm');
}

describe('Step', () => {
  let fixture: ComponentFixture<Host>;
  let flowService: FlowService;

  /** Seritteki basliklar, soldan saga. */
  const titles = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-step__title'))
      .map((element) => element.nativeElement.textContent.trim());

  /** Isaretlerin icerigi: numara ya da tik icin bos metin. */
  const markers = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-step__marker'))
      .map((element) => element.nativeElement.textContent.trim());

  const items = () => fixture.debugElement.queryAll(By.css('.app-step__item'));

  const strip = () => fixture.debugElement.query(By.css('.app-step'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    flowService = TestBed.inject(FlowService);
    fixture.detectChanges();
  });

  it('verilen adimlari sirayla cizer', () => {
    expect(titles()).toEqual(['Bilgiler', 'Onay', 'Sonuç']);
  });

  it('tek adimlik akista serit cizilmez', () => {
    fixture.componentInstance.steps.set([{ id: 'form', title: 'Bilgiler' }]);
    fixture.detectChanges();

    expect(strip()).toBeNull();
  });

  it('bulunulan adim aria-current alir', () => {
    const current = items().map((item) => item.nativeElement.getAttribute('aria-current'));

    expect(current).toEqual([null, 'step', null]);
  });

  it('bulunulandan oncekiler gecilmis sayilir ve tik alir', () => {
    expect(items()[0].nativeElement.classList.contains('app-step__item--done')).toBe(true);
    expect(items()[1].nativeElement.classList.contains('app-step__item--done')).toBe(false);

    expect(fixture.debugElement.queryAll(By.css('.app-step__check')).length).toBe(1);
    expect(markers()).toEqual(['', '2', '3']);
  });

  it('taninmayan aktif adimda ilk adim bulunulan sayilir', () => {
    fixture.componentInstance.active.set('boyle-bir-adim-yok');
    fixture.detectChanges();

    expect(items()[0].nativeElement.getAttribute('aria-current')).toBe('step');
    expect(fixture.debugElement.queryAll(By.css('.app-step__check')).length).toBe(0);
  });

  it('ekran okuyucu metni sira ve hal tasir', () => {
    const states = fixture.debugElement
      .queryAll(By.css('.app-step__state'))
      .map((element) => element.nativeElement.textContent.trim());

    expect(states).toEqual(['Adım 1, tamamlandı', 'Adım 2, bu adımda', 'Adım 3, sıradaki']);
  });

  it('baslik title ozniteliginde de durur', () => {
    const titles = fixture.debugElement
      .queryAll(By.css('.app-step__title'))
      .map((element) => element.nativeElement.getAttribute('title'));

    expect(titles).toEqual(['Bilgiler', 'Onay', 'Sonuç']);
  });

  it('adim verilmezse akis yapilandirmasindan okur', () => {
    flowService.config.set({
      config: {
        steps: [
          { step: 'start', title: 'Kapsam', validation: [] },
          { step: 'confirm', title: 'Onay', validation: [] },
          { step: 'execute', title: 'Sonuç', validation: [] },
        ],
      },
    });
    flowService.currentStep.set('execute');

    fixture.componentInstance.steps.set([]);
    fixture.componentInstance.active.set('');
    fixture.detectChanges();

    expect(titles()).toEqual(['Kapsam', 'Onay', 'Sonuç']);
    expect(items()[2].nativeElement.getAttribute('aria-current')).toBe('step');
  });

  it('yapilandirmadaki baslik anahtar biciminde verilebilir', () => {
    flowService.config.set({
      config: {
        steps: [
          { step: 'start', title: 'STEP_UNKNOWN_KEY | Bilgiler', validation: [] },
          { step: 'confirm', validation: [] },
        ],
      },
    });
    flowService.currentStep.set('start');

    fixture.componentInstance.steps.set([]);
    fixture.componentInstance.active.set('');
    fixture.detectChanges();

    expect(titles()).toEqual(['Bilgiler', 'Adım 2']);
  });
});
