import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { FlowConfig } from '@lib/base/baseconfig/config';
import { AccountsConfig } from '../../../app/modules/accounts/accounts.config';
import { CustomersConfig } from '../../../app/modules/customers/customers.config';
import { TransfersConfig } from '../../../app/modules/transfers/transfers.config';
import { Menu } from './menu';

@Component({ template: '' })
class Blank {}

/** Ekranların adım yapılandırması; menü için içeriği önemli değil. */
const stepConfig: FlowConfig = {
  config: { steps: [{ step: 'start', validation: [] }] },
};

/** Sunucudan gelen menü; yalnızca modül geçiş listesini besler. */
const SERVER_MENU = [
  {
    code: 'MENU_CUSTOMERS',
    title: 'Müşteriler',
    path: '',
    children: [{ code: 'MENU_CUSTOMERLIST', title: 'Müşteri Listesi', path: '/customers/customerlist/start' }],
  },
  {
    code: 'MENU_TRANSFERS',
    title: 'Transferler',
    path: '',
    children: [{ code: 'MENU_TRANSFERLIST', title: 'Transfer Takibi', path: '/transfers/transferlist/start' }],
  },
];

/** Gerçek route ağacının menüyü ilgilendiren parçası: modül yapılandırması ata route'ta durur. */
const routes = [
  {
    path: 'transfers',
    data: { moduleConfig: TransfersConfig },
    children: [
      { path: 'transferlist', children: [{ path: 'start', component: Blank, data: { config: stepConfig } }] },
      { path: 'transfercreate', children: [{ path: 'start', component: Blank, data: { config: stepConfig } }] },
    ],
  },
  {
    path: 'customers',
    data: { moduleConfig: CustomersConfig },
    children: [{ path: 'customerlist', children: [{ path: 'start', component: Blank, data: { config: stepConfig } }] }],
  },
  {
    path: 'accounts',
    data: { moduleConfig: AccountsConfig },
    children: [{ path: 'accountlist', children: [{ path: 'start', component: Blank, data: { config: stepConfig } }] }],
  },
];

describe('Menu', () => {
  let fixture: ComponentFixture<Menu>;
  let router: Router;

  /** İçinde bulunulan modülün menüdeki ekranları. */
  const itemTexts = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-menu__transaction'))
      .map((element) => element.nativeElement.textContent.trim());

  /** Modül geçiş listesindeki modüller. */
  const moduleTexts = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-menu__item--module .app-menu__label'))
      .map((element) => element.nativeElement.textContent.trim());

  /** Adrese gider ve menüyü yeniden çizer. */
  const goTo = async (url: string): Promise<void> => {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    });

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Menu);
    fixture.detectChanges();

    // Menü isteği bileşen kurulurken atılır; modül geçiş listesi bunu bekler.
    TestBed.inject(HttpTestingController)
      .match((request) => request.url.endsWith('/menu/list'))
      .forEach((request) => request.flush({ items: SERVER_MENU, totalCount: SERVER_MENU.length }));

    await goTo('/transfers/transferlist/start');
  });

  it('modulun butun transactionlarini gosterir', () => {
    expect(itemTexts()).toEqual(['Transfer Takibi', 'Transfer Oluştur']);
  });

  it('baska bir modulde farkli ekranlar gorunur', async () => {
    const before = itemTexts();

    await goTo('/customers/customerlist/start');

    expect(itemTexts()).toEqual(['Müşteri Listesi']);
    expect(itemTexts()).not.toEqual(before);
  });

  it('ucuncu bir modul yine kendi ekranlarini gosterir', async () => {
    await goTo('/accounts/accountlist/start');

    expect(itemTexts()).toEqual(['Hesap Listesi']);
  });

  it('ayni modulun iki transactioni ayni menuyu gorur', async () => {
    const onList = itemTexts();

    await goTo('/transfers/transfercreate/start');

    expect(itemTexts()).toEqual(onList);
  });

  it('acik olan ekran menude isaretlenir', async () => {
    expect(fixture.componentInstance.isActive('/transfers/transferlist/start')).toBe(true);

    await goTo('/transfers/transfercreate/start');

    expect(fixture.componentInstance.isActive('/transfers/transferlist/start')).toBe(false);
    expect(fixture.componentInstance.isActive('/transfers/transfercreate/start')).toBe(true);
  });

  it('panel basligi icinde bulunulan modulun adidir', async () => {
    expect(fixture.componentInstance.title()).toBe('Transferler');

    await goTo('/customers/customerlist/start');

    expect(fixture.componentInstance.title()).toBe('Müşteriler');
  });

  it('modul gecis listesi sunucudan gelir ve modulle degismez', async () => {
    expect(moduleTexts()).toEqual(['Müşteriler', 'Transferler']);

    await goTo('/customers/customerlist/start');

    expect(moduleTexts()).toEqual(['Müşteriler', 'Transferler']);
  });

  it('gecis listesinde icinde bulunulan modul isaretlenir', async () => {
    expect(fixture.componentInstance.isActiveModule('MENU_TRANSFERS')).toBe(true);
    expect(fixture.componentInstance.isActiveModule('MENU_CUSTOMERS')).toBe(false);

    await goTo('/customers/customerlist/start');

    expect(fixture.componentInstance.isActiveModule('MENU_CUSTOMERS')).toBe(true);
  });
});
