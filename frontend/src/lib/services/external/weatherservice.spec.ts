import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { environment } from '@env/environment';
import { BaseInterceptor } from '@lib/base/baseinterceptor/baseinterceptor';
import { WeatherInterceptor } from '@lib/base/baseinterceptor/weatherinterceptor';
import { WEATHER_BASE_PATH, WeatherService } from './weatherservice';

describe('WeatherService', () => {
  let service: WeatherService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([BaseInterceptor, WeatherInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(WeatherService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('kok adres ortam dosyasindan gelir', () => {
    expect(WEATHER_BASE_PATH.startsWith(environment.weather.url)).toBe(true);
    expect(WEATHER_BASE_PATH.endsWith('/')).toBe(true);
  });

  it('istek servisin kendi uc noktasina gider', () => {
    service.current(39.93, 32.86).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${WEATHER_BASE_PATH}v1/forecast`).request;

    expect(request.params.get('latitude')).toBe('39.93');
    expect(request.params.get('longitude')).toBe('32.86');
    expect(request.params.get('current')).toBe('temperature_2m');
  });

  it('istege oturum token i eklenmez', () => {
    service.current(39.93, 32.86).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${WEATHER_BASE_PATH}v1/forecast`).request;

    expect(request.headers.get('Authorization')).toBeNull();
    expect(request.headers.get('Accept')).toBe('application/json');
  });

  it('yanit sadelestirilerek dondurulur', async () => {
    const promise = new Promise<unknown>((resolve) => service.current(39.93, 32.86).subscribe(resolve));

    controller
      .expectOne((candidate) => candidate.url === `${WEATHER_BASE_PATH}v1/forecast`)
      .flush({ current: { temperature_2m: 21.4, time: '2026-09-13T11:00' } });

    await expect(promise).resolves.toEqual({ temperature: 21.4, time: '2026-09-13T11:00' });
  });

  it('eksik alanlar varsayilana duser', async () => {
    const promise = new Promise<unknown>((resolve) => service.current(0, 0).subscribe(resolve));

    controller.expectOne((candidate) => candidate.url === `${WEATHER_BASE_PATH}v1/forecast`).flush({});

    await expect(promise).resolves.toEqual({ temperature: 0, time: '' });
  });
});
