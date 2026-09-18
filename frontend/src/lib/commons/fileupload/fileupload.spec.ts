import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { Fileupload, UploadFile } from './fileupload';

@Component({
  imports: [Fileupload, FormsModule],
  template: `
    <app-fileupload
      id="documents"
      label="Belgeler"
      [accept]="accept()"
      [multiple]="multiple()"
      [maxSize]="maxSize()"
      [maxCount]="maxCount()"
      [(ngModel)]="files"
    />
  `,
})
class Host {
  readonly accept = signal('.pdf,.xlsx,.csv');
  readonly multiple = signal(true);
  readonly maxSize = signal(10);
  readonly maxCount = signal(3);
  files: UploadFile[] = [];
}

/** Verilen boyutta sahte bir dosya uretir. */
function makeFile(name: string, bytes = 1024): File {
  return new File([new Uint8Array(bytes)], name);
}

/** FileList yerine gecen en kucuk nesne; bilesen yalnizca dolasip uzunluk okuyor. */
function makeList(...files: File[]): FileList {
  return { ...files, length: files.length, item: (index: number) => files[index] } as unknown as FileList;
}

describe('Fileupload', () => {
  let fixture: ComponentFixture<Host>;

  const picker = (): HTMLInputElement =>
    fixture.debugElement.query(By.css('.app-fileupload__picker')).nativeElement;

  const zone = () => fixture.debugElement.query(By.css('.app-fileupload__zone'));

  const rows = () => fixture.debugElement.queryAll(By.css('.app-fileupload__item'));

  const names = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-fileupload__name'))
      .map((element) => element.nativeElement.textContent.trim());

  const rejected = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.app-fileupload__rejected li'))
      .map((element) => element.nativeElement.textContent.trim());

  /** Seciciden dosya gelmis gibi davranir. */
  const pick = (...files: File[]): void => {
    const field = picker();
    Object.defineProperty(field, 'files', { value: makeList(...files), configurable: true });
    field.dispatchEvent(new Event('change'));

    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('secilen dosyalar listelenir ve ngModel e yazilir', () => {
    pick(makeFile('rapor.pdf'), makeFile('liste.xlsx'));

    expect(names()).toEqual(['rapor.pdf', 'liste.xlsx']);
    expect(fixture.componentInstance.files.map((item) => item.name)).toEqual(['rapor.pdf', 'liste.xlsx']);
    expect(fixture.componentInstance.files[0].file).toBeInstanceOf(File);
  });

  it('kabul edilmeyen tur elenir ve sebebi yazilir', () => {
    pick(makeFile('resim.png'));

    expect(rows().length).toBe(0);
    expect(rejected()[0]).toContain('resim.png');
    expect(rejected()[0]).toContain('tür kabul edilmiyor');
  });

  it('boyut sinirini asan dosya elenir', () => {
    fixture.componentInstance.maxSize.set(1);
    fixture.detectChanges();

    pick(makeFile('buyuk.pdf', 2 * 1024 * 1024));

    expect(rows().length).toBe(0);
    expect(rejected()[0]).toContain('boyut sınırını aşıyor');
  });

  it('ayni dosya iki kez eklenmez', () => {
    pick(makeFile('rapor.pdf'));
    pick(makeFile('rapor.pdf'));

    expect(names()).toEqual(['rapor.pdf']);
    expect(rejected()[0]).toContain('aynı dosya zaten ekli');
  });

  it('adet siniri dolunca kalanlar elenir', () => {
    pick(makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf'), makeFile('d.pdf'));

    expect(names()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(rejected()[0]).toContain('dosya sayısı sınırı dolu');
  });

  it('tek dosyalik alanda yeni secim oncekinin yerine gecer', () => {
    fixture.componentInstance.multiple.set(false);
    fixture.detectChanges();

    pick(makeFile('ilk.pdf'));
    pick(makeFile('ikinci.pdf'));

    expect(names()).toEqual(['ikinci.pdf']);
  });

  it('kaldir butonu dosyayi listeden cikarir', () => {
    pick(makeFile('rapor.pdf'), makeFile('liste.xlsx'));

    fixture.debugElement.queryAll(By.css('.app-fileupload__remove'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(names()).toEqual(['liste.xlsx']);
    expect(fixture.componentInstance.files.map((item) => item.name)).toEqual(['liste.xlsx']);
  });

  it('rozet uzantiya gore turlenir', () => {
    pick(makeFile('rapor.pdf'), makeFile('liste.xlsx'));

    const badges = fixture.debugElement.queryAll(By.css('.app-fileupload__badge'));

    expect(badges[0].nativeElement.classList.contains('app-fileupload__badge--pdf')).toBe(true);
    expect(badges[1].nativeElement.classList.contains('app-fileupload__badge--sheet')).toBe(true);
    expect(badges[0].nativeElement.textContent.trim()).toBe('pdf');
  });

  it('boyut okunur bicimde yazilir', () => {
    pick(makeFile('rapor.pdf', 1536));

    expect(fixture.debugElement.query(By.css('.app-fileupload__size')).nativeElement.textContent.trim()).toBe('1,5 KB');
  });

  it('surukleme alani isaretler, birakinca dosya eklenir', () => {
    // jsdom DragEvent tanimlamiyor; bilesen yalnizca preventDefault ve
    // dataTransfer kullandigi icin duz bir olay yetiyor.
    zone().nativeElement.dispatchEvent(new Event('dragover', { bubbles: true }));
    fixture.detectChanges();

    expect(zone().nativeElement.classList.contains('app-fileupload__zone--over')).toBe(true);

    const drop = new Event('drop', { bubbles: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: makeList(makeFile('rapor.pdf')) } });
    zone().nativeElement.dispatchEvent(drop);
    fixture.detectChanges();

    expect(zone().nativeElement.classList.contains('app-fileupload__zone--over')).toBe(false);
    expect(names()).toEqual(['rapor.pdf']);
  });

  it('kural ozeti turleri ve sinirlari yazar', () => {
    const hint = fixture.debugElement.query(By.css('.app-fileupload__hint')).nativeElement.textContent;

    expect(hint).toContain('PDF, XLSX, CSV');
    expect(hint).toContain('10 MB');
    expect(hint).toContain('3 dosya');
  });
});
