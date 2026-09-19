import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { BaseInterceptor } from '@lib/base/baseinterceptor/baseinterceptor';
import { GeocodeInterceptor } from '@lib/base/baseinterceptor/geocodeinterceptor';
import { GEOCODE_BASE_PATH, GeocodePlace, GeocodeService } from './geocodeservice';

/** Nominatim'in Kadıköy için döndürdüğüne benzeyen bir kayıt. */
const KADIKOY = {
  place_id: 4711,
  osm_type: 'way',
  osm_id: 123,
  lat: '40.987654',
  lon: '29.026543',
  display_name: 'Moda Caddesi, Caferağa, Kadıköy, İstanbul, 34710, Türkiye',
  class: 'highway',
  type: 'residential',
  boundingbox: ['40.98', '40.99', '29.02', '29.03'],
  address: {
    house_number: '12',
    road: 'Moda Caddesi',
    neighbourhood: 'Caferağa',
    county: 'Kadıköy',
    province: 'İstanbul',
    postcode: '34710',
    country_code: 'tr',
  },
};

describe('GeocodeService', () => {
  let service: GeocodeService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([BaseInterceptor, GeocodeInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(GeocodeService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('kok adres bos degilse egik cizgiyle biter', () => {
    expect(GEOCODE_BASE_PATH === '' || GEOCODE_BASE_PATH.endsWith('/')).toBe(true);
  });

  it('bos metin icin istek atilmaz', async () => {
    const promise = new Promise<unknown>((resolve) => service.search('   ').subscribe(resolve));

    await expect(promise).resolves.toEqual([]);
  });

  it('acik olma durumu kok adresle ayni seyi soyler', async () => {
    expect(service.enabled).toBe(GEOCODE_BASE_PATH.length > 0);

    // Kapali ortamda istek atilmadigi da burada goruluyor; controller.verify()
    // beklenmeyen bir istek kalmadigini dogruluyor.
    if (!service.enabled) {
      const search = new Promise<unknown>((resolve) => service.search('Moda').subscribe(resolve));
      const reverse = new Promise<unknown>((resolve) => service.reverse(40.9, 29.0).subscribe(resolve));

      await expect(search).resolves.toEqual([]);
      await expect(reverse).resolves.toBeNull();
    }
  });

  it('arama istegi kendi uc noktasina ve Turkiye sinirli gider', () => {
    if (!service.enabled) {
      return;
    }

    service.search('Moda Caddesi').subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}search`).request;

    expect(request.params.get('q')).toBe('Moda Caddesi');
    expect(request.params.get('countrycodes')).toBe('tr');
    expect(request.params.get('addressdetails')).toBe('1');
    // Oturum token'i disariya cikmamali.
    expect(request.headers.get('Authorization')).toBeNull();
  });

  it('alanlara bolunmus arama Nominatim alan adlarina cevrilir', () => {
    if (!service.enabled) {
      return;
    }

    service.searchStructured({ street: 'Moda Caddesi 12', district: 'Kadıköy', province: 'İstanbul' }).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}search`).request;

    expect(request.params.get('street')).toBe('Moda Caddesi 12');
    expect(request.params.get('city')).toBe('Kadıköy');
    expect(request.params.get('state')).toBe('İstanbul');
    expect(request.params.get('q')).toBeNull();
  });

  it('hicbir alan verilmeyen bolunmus aramada istek atilmaz', async () => {
    const promise = new Promise<unknown>((resolve) => service.searchStructured({}).subscribe(resolve));

    await expect(promise).resolves.toEqual([]);
  });

  it('yanit Turkiye adres duzenine cevrilir', async () => {
    if (!service.enabled) {
      return;
    }

    const promise = new Promise<GeocodePlace[]>((resolve) => service.search('Moda').subscribe(resolve));

    controller.expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}search`).flush([KADIKOY]);

    const [place] = await promise;

    expect(place.address.province).toBe('İstanbul');
    expect(place.address.district).toBe('Kadıköy');
    expect(place.address.neighbourhood).toBe('Caferağa');
    expect(place.address.street).toBe('Moda Caddesi');
    expect(place.address.houseNumber).toBe('12');
    expect(place.formatted).toBe('Caferağa Moda Caddesi No:12, 34710 Kadıköy/İstanbul');
    expect(place.latitude).toBe(40.987654);
    expect(place.longitude).toBe(29.026543);
  });

  it('kutu bati-guney-dogu-kuzey sirasina cevrilir', async () => {
    if (!service.enabled) {
      return;
    }

    const promise = new Promise<GeocodePlace[]>((resolve) => service.search('Moda').subscribe(resolve));

    controller.expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}search`).flush([KADIKOY]);

    const [place] = await promise;

    // Nominatim [guney, kuzey, bati, dogu] veriyor.
    expect(place.bounds).toEqual([29.02, 40.98, 29.03, 40.99]);
  });

  it('ters geokodlama konumu ve ayrinti kademesini gonderir', () => {
    if (!service.enabled) {
      return;
    }

    service.reverse(40.98, 29.02).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}reverse`).request;

    expect(request.params.get('lat')).toBe('40.98');
    expect(request.params.get('lon')).toBe('29.02');
    expect(request.params.get('zoom')).toBe('18');
  });

  it('adres bulunamadiginda null doner', async () => {
    if (!service.enabled) {
      return;
    }

    const promise = new Promise<GeocodePlace | null>((resolve) => service.reverse(0, 0).subscribe(resolve));

    controller
      .expectOne((candidate) => candidate.url === `${GEOCODE_BASE_PATH}reverse`)
      .flush({ error: 'Unable to geocode' });

    await expect(promise).resolves.toBeNull();
  });
});
