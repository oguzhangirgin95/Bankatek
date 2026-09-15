import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FlowService } from '../baseservice/flowservice';
import { BaseInterceptor } from './baseinterceptor';

const EXTERNAL = 'https://harici-servis.example/veri';

describe('BaseInterceptor kapsami', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let flowService: FlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([BaseInterceptor])),
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

  it('backend istegine oturum ve ekran basliklari eklenir', () => {
    http.get('/api/account/list').subscribe();

    const request = controller.expectOne('/api/account/list').request;

    expect(request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.headers.get('X-Transaction')).toBe('branches/branchlist');
    expect(request.headers.get('Accept-Language')).toBeTruthy();
  });

  it('backend disi istege token eklenmez', () => {
    http.get(EXTERNAL).subscribe();

    const request = controller.expectOne(EXTERNAL).request;

    expect(request.headers.get('Authorization')).toBeNull();
    expect(request.headers.get('X-Transaction')).toBeNull();
    expect(request.headers.get('Accept-Language')).toBeNull();
  });

  it('backend istegi yukleniyor sayacini artirir', () => {
    http.get('/api/account/list').subscribe();

    expect(flowService.pendingRequests()).toBe(1);

    controller.expectOne('/api/account/list').flush({});

    expect(flowService.pendingRequests()).toBe(0);
  });

  it('backend disi istek yukleniyor sayacina dokunmaz', () => {
    http.get(EXTERNAL).subscribe();

    expect(flowService.pendingRequests()).toBe(0);

    controller.expectOne(EXTERNAL).flush({});

    expect(flowService.pendingRequests()).toBe(0);
  });

  it('backend hatasi serviceError alanina yazilir', () => {
    http.get('/api/account/list').subscribe({ error: () => undefined });

    controller.expectOne('/api/account/list').flush('bozuk', { status: 500, statusText: 'Server Error' });

    expect(flowService.get('serviceError')).toBe('500 - Server Error');
  });

  it('backend disi hata serviceError alanina yazilmaz', () => {
    flowService.set('serviceError', undefined);

    http.get(EXTERNAL).subscribe({ error: () => undefined });

    controller.expectOne(EXTERNAL).flush('bozuk', { status: 500, statusText: 'Server Error' });

    expect(flowService.get('serviceError')).toBeUndefined();
  });
});
