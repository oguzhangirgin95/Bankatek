import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { BaseComponent } from '../basecomponent/basecomponent';
import { Input } from '@lib/commons/input/input';
import { Modal } from '@lib/commons/modal/modal';
import { Pagination } from '@lib/commons/pagination/pagination';
import { Select } from '@lib/commons/select/select';

@Component({
  imports: [FormsModule, Input, Modal, Pagination, Select],
  template: `
    <app-input id="username" [(ngModel)]="State.Request.username" />
    <app-input id="refreshSeconds" type="number" [(ngModel)]="State.Request.refreshSeconds" />
    <app-select
      id="cityId"
      placeholder="Tümü"
      [options]="options()"
      [ngModel]="State.Request.cityId"
      (ngModelChange)="changeCity($event)"
    />
    <app-input id="locked" [disabled]="locked()" [(ngModel)]="State.Request.locked" />
    <app-pagination
      [totalCount]="100"
      [pageSize]="20"
      [pageNumber]="State.Request.pageNumber"
      (pageNumberChange)="setPage($event)"
    />
    <app-modal [open]="!!State.SelectedId" (openChange)="closeDetail()" />
    <p class="echo">{{ State.Request.username }}</p>
  `,
})
class Host extends BaseComponent {
  readonly options = signal<{ value: string; text: string }[]>([]);

  readonly locked = signal(false);

  changeCount = 0;

  constructor() {
    super();
    this.State.Request = { username: '', refreshSeconds: 0, cityId: '', pageNumber: 1 };
    this.State.SelectedId = '42';
  }

  changeCity(cityId: string) {
    this.State.Request.cityId = cityId;
    this.changeCount++;
  }

  setPage(page: number) {
    this.State.Request.pageNumber = page;
    this.changeCount++;
  }

  closeDetail() {
    this.State.SelectedId = undefined;
  }
}

describe('ngModel + derin reaktif State', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  const type = async (id: string, value: string) => {
    const field = fixture.nativeElement.querySelector(`input#${id}`) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  it('yazılan değer State.Request icine iki yonlu gider', async () => {
    await type('username', 'oguzhan');

    expect(fixture.componentInstance.State.Request.username).toBe('oguzhan');
  });

  it('derindeki yazma sablonu yeniden cizer', async () => {
    await type('username', 'oguzhan');

    expect(fixture.nativeElement.querySelector('.echo').textContent.trim()).toBe('oguzhan');
  });

  it('State disaridan degisince alan guncellenir', async () => {
    fixture.componentInstance.State.Request.username = 'disaridan';
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector('input#username') as HTMLInputElement;
    expect(field.value).toBe('disaridan');
  });

  it('type=number alan sayi yazar, metin degil', async () => {
    await type('refreshSeconds', '45');

    expect(fixture.componentInstance.State.Request.refreshSeconds).toBe(45);
  });

  const loadCities = async () => {
    fixture.componentInstance.options.set([
      { value: '34', text: 'İstanbul' },
      { value: '06', text: 'Ankara' },
    ]);
    await fixture.whenStable();
  };

  const pick = async (text: string) => {
    const field = fixture.nativeElement.querySelector('select#cityId') as HTMLSelectElement;
    const option = [...field.options].find((item) => item.textContent?.trim() === text)!;

    field.value = option.value;
    field.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  it('ngModelChange yan etkiyi bir kez tetikler', async () => {
    await loadCities();
    await pick('İstanbul');

    expect(fixture.componentInstance.State.Request.cityId).toBe('34');
    expect(fixture.componentInstance.changeCount).toBe(1);
  });

  it('secenekler sonradan gelse de secili deger isaretlenir', async () => {
    // Ekranlarda sık görülen sıra: önce filtre değeri kurulur, şehir listesi
    // servisten sonra düşer. Seçenek geldiğinde seçili görünmek zorunda.
    fixture.componentInstance.State.Request.cityId = '06';
    await fixture.whenStable();

    await loadCities();

    const field = fixture.nativeElement.querySelector('select#cityId') as HTMLSelectElement;
    expect(field.selectedOptions[0].textContent!.trim()).toBe('Ankara');
  });

  it('placeholder secilince bos deger doner', async () => {
    await loadCities();
    await pick('İstanbul');
    await pick('Tümü');

    expect(fixture.componentInstance.State.Request.cityId).toBe('');
  });

  it('[disabled] girdisi icerideki alani pasife ceker', async () => {
    const field = fixture.nativeElement.querySelector('input#locked') as HTMLInputElement;
    expect(field.disabled).toBe(false);

    fixture.componentInstance.locked.set(true);
    await fixture.whenStable();

    expect(field.disabled).toBe(true);
  });

  it('pageNumberChange sayfayi State icine yazar', async () => {
    const next = [...fixture.nativeElement.querySelectorAll('.app-pagination__button')].find(
      (item: HTMLButtonElement) => item.textContent?.trim() === '3',
    ) as HTMLButtonElement;

    next.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.State.Request.pageNumber).toBe(3);
  });

  it('openChange diyalogu kapatir ve secili kaydi temizler', async () => {
    expect(fixture.nativeElement.querySelector('.app-modal')).not.toBeNull();

    (fixture.nativeElement.querySelector('.app-modal__close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.State.SelectedId).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.app-modal')).toBeNull();
  });

  it('ayni nesne icin hep ayni proxy doner', () => {
    const state = fixture.componentInstance.State;

    expect(state.Request).toBe(state.Request);
  });
});
