import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { FlowService } from '../baseservice/flowservice';
import { BaseInterceptor } from './baseinterceptor';
import { WeatherInterceptor } from './weatherinterceptor';
import { WEATHER_BASE_PATH } from '@lib/services/external/weatherservice';

const BACKEND = '/api/account/list';
const WEATHER = `${WEATHER_BASE_PATH}v1/forecast?latitude=39.9&longitude=32.8`;

describe('Iki interceptor birlikte', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let flowService: FlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([BaseInterceptor, WeatherInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    flowService = TestBed.inject(FlowService);

    flowService.token.set('test-token');
    flowService.transaction.set('branches/branchlist');
  });

  afterEach(() => controller.verify());

  it('hava durumu istegine oturum token i eklenmez', () => {
    http.get(WEATHER).subscribe();

    const request = controller.expectOne(WEATHER).request;

    expect(request.headers.get('Authorization')).toBeNull();
    expect(request.headers.get('X-Transaction')).toBeNull();
    expect(request.headers.get('Accept')).toBe('application/json');
  });

  it('backend istegine hava durumu halkasi karismaz', () => {
    http.get(BACKEND).subscribe();

    const request = controller.expectOne(BACKEND).request;

    expect(request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(flowService.get('weatherError')).toBeUndefined();
  });

  it('hava durumu global yukleniyor sayacini artirmaz', () => {
    http.get(WEATHER).subscribe();

    expect(flowService.pendingRequests()).toBe(0);

    controller.expectOne(WEATHER).flush({});
  });

  it('hava durumu hatasi iki kez yeniden denenir, sonra kendi alanina yazilir', () => {
    vi.useFakeTimers();

    try {
      http.get(WEATHER).subscribe({ error: () => undefined });

      for (let attempt = 0; attempt < 3; attempt++) {
        controller.expectOne(WEATHER).flush('bozuk', { status: 503, statusText: 'Unavailable' });
        vi.advanceTimersByTime(500);
      }
    } finally {
      vi.useRealTimers();
    }

    expect(flowService.get('weatherError')).toBe('503 - Unavailable');
    expect(flowService.get('serviceError')).toBeUndefined();
  });

  it('backend hatasi hava durumu alanini kirletmez', () => {
    http.get(BACKEND).subscribe({ error: () => undefined });

    controller.expectOne(BACKEND).flush('bozuk', { status: 500, statusText: 'Server Error' });

    expect(flowService.get('serviceError')).toBe('500 - Server Error');
    expect(flowService.get('weatherError')).toBeUndefined();
  });
});
