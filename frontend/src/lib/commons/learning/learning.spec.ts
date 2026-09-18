import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FlowConfig } from '@lib/base/baseconfig/config';
import { FlowService } from '@lib/base/baseservice/flowservice';
import { TourService } from '@lib/base/baseservice/tourservice';
import { Learning } from './learning';

@Component({
  imports: [Learning],
  template: `<app-learning />`,
})
class Host {}

/** Iki duragi olan bir ekran yapilandirmasi. */
const WITH_TOUR: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        validation: [],
        tour: [
          { id: 'customerId', title: 'BOS|Önce müşteriyi seçin', text: 'BOS|Gönderen müşteri buradan seçilir.' },
          { id: 'amount', title: 'BOS|Tutarı yazın', text: 'BOS|Günlük limit işlem sırasında denetlenir.' },
        ],
      },
    ],
  },
};

/** Turu olmayan ekran. */
const WITHOUT_TOUR: FlowConfig = {
  config: { steps: [{ step: 'start', validation: [] }] },
};

describe('Learning', () => {
  let fixture: ComponentFixture<Host>;
  let flowService: FlowService;
  let tourService: TourService;

  const button = (): HTMLButtonElement => fixture.debugElement.query(By.css('.app-learning__button')).nativeElement;

  const panel = () => fixture.debugElement.query(By.css('.app-sidemodal'));

  const stops = () => fixture.debugElement.queryAll(By.css('.app-learning__stop'));

  /** Ekranin yapilandirmasini kurar ve paneli acar. */
  const openWith = (config: FlowConfig): void => {
    flowService.config.set(config);
    flowService.currentStep.set('start');

    fixture.detectChanges();
    button().click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    flowService = TestBed.inject(FlowService);
    tourService = TestBed.inject(TourService);

    fixture.detectChanges();
  });

  it('panel once kapalidir, butona basilinca acilir', () => {
    flowService.config.set(WITH_TOUR);
    flowService.currentStep.set('start');
    fixture.detectChanges();

    expect(panel()).toBeNull();

    button().click();
    fixture.detectChanges();

    expect(panel()).not.toBeNull();
  });

  it('duraklar sirayla listelenir', () => {
    openWith(WITH_TOUR);

    const titles = fixture.debugElement
      .queryAll(By.css('.app-learning__name'))
      .map((element) => element.nativeElement.textContent.trim());

    expect(titles).toEqual(['Önce müşteriyi seçin', 'Tutarı yazın']);
    expect(
      fixture.debugElement.queryAll(By.css('.app-learning__order')).map((item) => item.nativeElement.textContent.trim()),
    ).toEqual(['1', '2']);
  });

  it('duraga tiklayinca tur o duraktan baslar ve panel kapanir', () => {
    const start = vi.spyOn(tourService, 'start').mockImplementation(() => undefined);

    openWith(WITH_TOUR);
    stops()[1].nativeElement.click();
    fixture.detectChanges();

    expect(start).toHaveBeenCalledWith(1);
    expect(panel()).toBeNull();
  });

  it('bastan baslat sifirinci duragi cagirir', () => {
    const start = vi.spyOn(tourService, 'start').mockImplementation(() => undefined);

    openWith(WITH_TOUR);
    fixture.debugElement.query(By.css('.app-learning__restart')).nativeElement.click();

    expect(start).toHaveBeenCalledWith(0);
  });

  it('turu olmayan ekranda bos durum cikar', () => {
    openWith(WITHOUT_TOUR);

    expect(stops().length).toBe(0);
    expect(fixture.debugElement.query(By.css('.app-learning__empty'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.app-learning__restart'))).toBeNull();
  });

  it('ipuclarini yeniden ac turu sifirlar ve paneli kapatir', () => {
    const reset = vi.spyOn(tourService, 'reset').mockImplementation(() => undefined);

    openWith(WITH_TOUR);
    fixture.debugElement.query(By.css('.app-learning__reopen')).nativeElement.click();
    fixture.detectChanges();

    expect(reset).toHaveBeenCalled();
    expect(panel()).toBeNull();
  });
});
