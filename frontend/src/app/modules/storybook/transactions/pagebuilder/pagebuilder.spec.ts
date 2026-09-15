import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PagebuilderStart } from './pagebuilder.start';

function dragEvent(): DragEvent {
  return new Event('drop', { bubbles: true }) as DragEvent;
}

describe('Sayfa olusturucu', () => {
  let fixture: ComponentFixture<PagebuilderStart>;
  let component: PagebuilderStart;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(PagebuilderStart);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  afterEach(() => {
    controller.match(() => true).forEach((request) => request.flush({}));
  });

  it('baslangicta sayfa bos', () => {
    expect(component.empty()).toBe(true);
    expect(fixture.debugElement.query(By.css('.builder__empty'))).toBeTruthy();
  });

  it('paletten suruklenen bileşen sayfaya eklenir', () => {
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);
    fixture.detectChanges();

    expect(component.blocks().length).toBe(1);
    expect(component.blocks()[0].type).toBe('statcard');
    expect(fixture.debugElement.query(By.css('app-statcard'))).toBeTruthy();
  });

  it('her birakma ayri kimlikli blok uretir', () => {
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);

    const ids = component.blocks().map((block) => block.id);

    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('belirtilen siraya eklenir', () => {
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);
    component.dragFromPalette(component.palette[1]);
    component.drop(dragEvent(), 0);

    expect(component.blocks().map((block) => block.type)).toEqual(['info', 'statcard']);
  });

  it('sayfa icinde surukleyerek sira degistirilir', () => {
    ['statcard', 'info', 'progress'].forEach((type) => {
      component.dragFromPalette(component.palette.find((item) => item.type === type)!);
      component.drop(dragEvent(), -1);
    });

    expect(component.blocks().map((block) => block.type)).toEqual(['statcard', 'info', 'progress']);

    component.dragFromPage(2);
    component.drop(dragEvent(), 0);

    expect(component.blocks().map((block) => block.type)).toEqual(['progress', 'statcard', 'info']);
  });

  it('blok kaldirilir', () => {
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);
    component.dragFromPalette(component.palette[1]);
    component.drop(dragEvent(), -1);

    component.remove(0);

    expect(component.blocks().map((block) => block.type)).toEqual(['info']);
  });

  it('temizle butonu sayfayi bosaltir', () => {
    component.dragFromPalette(component.palette[0]);
    component.drop(dragEvent(), -1);

    component.clear();

    expect(component.empty()).toBe(true);
  });

  it('rapor cercevesi acilir ve sayfadaki bloklari icerir', () => {
    component.dragFromPalette(component.palette.find((item) => item.type === 'statcard')!);
    component.drop(dragEvent(), -1);
    fixture.detectChanges();

    const before = document.querySelectorAll('iframe').length;

    component.report();

    const frames = document.querySelectorAll('iframe');

    expect(frames.length).toBe(before + 1);

    const written = frames[frames.length - 1].contentDocument?.documentElement.innerHTML ?? '';

    expect(written).toContain('Sayfa raporu');
    expect(written).toContain('app-statcard');
    expect(written).toContain('builder__remove');
  });

  it('bos sayfada rapor cerceve acmaz', () => {
    const before = document.querySelectorAll('iframe').length;

    component.clear();
    fixture.detectChanges();
    component.report();

    expect(document.querySelectorAll('iframe').length).toBe(before);
  });
});
