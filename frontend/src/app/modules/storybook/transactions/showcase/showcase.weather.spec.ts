import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { BaseInterceptor } from '@lib/base/baseinterceptor/baseinterceptor';
import { WeatherInterceptor } from '@lib/base/baseinterceptor/weatherinterceptor';
import { WEATHER_BASE_PATH } from '@lib/services/external/weatherservice';
import { ShowcaseStart } from './showcase.start';

const FORECAST = `${WEATHER_BASE_PATH}v1/forecast`;

describe('Showcase hava durumu butonu', () => {
  let fixture: ComponentFixture<ShowcaseStart>;
  let controller: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([BaseInterceptor, WeatherInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(ShowcaseStart);
    fixture.detectChanges();
    await fixture.whenStable();

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.match(() => true).forEach((request) => request.flush({}));
  });

  it('butona basilinca hava durumu servisine istek gider', async () => {
    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => (item.nativeElement.textContent ?? '').includes('Hava durumunu getir'));

    expect(button).toBeTruthy();

    button!.nativeElement.click();
    fixture.detectChanges();

    const request = controller.expectOne((candidate) => candidate.url === FORECAST).request;

    expect(request.params.get('latitude')).toBe('39.93');
    expect(request.params.get('longitude')).toBe('32.86');
    expect(request.headers.get('Authorization')).toBeNull();
  });

  it('gelen sicaklik ekranda gosterilir', async () => {
    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => (item.nativeElement.textContent ?? '').includes('Hava durumunu getir'));

    button!.nativeElement.click();
    fixture.detectChanges();

    controller
      .expectOne((candidate) => candidate.url === FORECAST)
      .flush({ current: { temperature_2m: 21.4, time: '2026-09-13T11:00' } });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.weather()).toBe('Ankara: 21.4 °C');
  });
});
