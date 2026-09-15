import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { FlowConfig } from '../baseconfig/config';
import { FlowService } from './flowservice';

@Component({ template: '' })
class Blank {}

const configA: FlowConfig = {
  config: { steps: [{ step: 'start', validation: [] }] },
};

const configB: FlowConfig = {
  config: { steps: [{ step: 'start', validation: [] }] },
};

const configKeep: FlowConfig = {
  config: { steps: [{ step: 'start', keepState: true, validation: [] }] },
};

describe('navigate(target, keepState)', () => {
  let flowService: FlowService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'moda',
            children: [{ path: 'txa', children: [{ path: 'start', component: Blank, data: { config: configA } }] }],
          },
          {
            path: 'modb',
            children: [{ path: 'txb', children: [{ path: 'start', component: Blank, data: { config: configB } }] }],
          },
          {
            path: 'modc',
            children: [{ path: 'txc', children: [{ path: 'start', component: Blank, data: { config: configKeep } }] }],
          },
        ]),
      ],
    });

    flowService = TestBed.inject(FlowService);
    router = TestBed.inject(Router);

    await router.navigateByUrl('/moda/txa/start');
  });

  it('varsayilan davranista State temizlenir', async () => {
    flowService.set('Foo', 'deger');

    await flowService.navigate('modb/txb/start');

    expect(flowService.get('Foo')).toBeUndefined();
  });

  it('keepState true verilince State korunur', async () => {
    flowService.set('Foo', 'deger');

    await flowService.navigate('modb/txb/start', true);

    expect(flowService.get('Foo')).toBe('deger');
  });

  it('bayrak tek seferliktir, sonraki gecise sizmaz', async () => {
    flowService.set('Foo', 'deger');

    await flowService.navigate('modb/txb/start', true);
    expect(flowService.get('Foo')).toBe('deger');

    await flowService.navigate('moda/txa/start');
    expect(flowService.get('Foo')).toBeUndefined();
  });

  it('adim yazilmazsa start varsayilir', async () => {
    await flowService.navigate('modb/txb');

    expect(router.url).toBe('/modb/txb/start');
  });

  it('tam adres oldugu gibi kullanilir', async () => {
    await flowService.navigate('/modb/txb/start');

    expect(router.url).toBe('/modb/txb/start');
  });

  it('config uzerindeki keepState calismaya devam eder', async () => {
    flowService.set('Foo', 'deger');

    await flowService.navigate('modc/txc/start');

    expect(flowService.get('Foo')).toBe('deger');
  });

  it('ayni transaction icinde State zaten korunur', async () => {
    flowService.set('Foo', 'deger');

    await flowService.navigate('moda/txa/start');

    expect(flowService.get('Foo')).toBe('deger');
  });
});
