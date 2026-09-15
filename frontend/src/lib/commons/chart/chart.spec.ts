import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { Chart, ChartItem, ChartType } from './chart';

const ITEMS: ChartItem[] = [
  { label: 'Ankara', value: 42 },
  { label: 'İstanbul', value: 35 },
  { label: 'İzmir', value: 23 },
];

@Component({
  imports: [Chart],
  template: '<app-chart [type]="type()" [items]="items()" />',
})
class Host {
  readonly type = signal<ChartType>('bar');
  readonly items = signal<ChartItem[]>(ITEMS);
}

describe('Chart', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let chart: Chart;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();

    chart = fixture.debugElement.query(By.directive(Chart)).componentInstance;
  });

  it('renk verilmeyen ogeler paletten sirayla boyanir', () => {
    const colors = chart.colored().map((item) => item.color);

    expect(new Set(colors).size).toBe(3);
    expect(colors.every((color) => color.startsWith('var(--color-'))).toBe(true);
  });

  it('verilen renk korunur', () => {
    host.items.set([{ label: 'Ankara', value: 1, color: '#abcdef' }]);
    fixture.detectChanges();

    expect(chart.colored()[0].color).toBe('#abcdef');
  });

  it('sutun yuksekligi en buyuk degere oranli', () => {
    host.type.set('column');
    fixture.detectChanges();

    const [first, , last] = chart.columns();

    expect(first.height).toBeGreaterThan(last.height);
    expect(last.height / first.height).toBeCloseTo(23 / 42, 5);
  });

  it('sutunlar taban cizgisinde oturur', () => {
    host.type.set('column');
    fixture.detectChanges();

    chart.columns().forEach((column) => expect(column.y + column.height).toBeCloseTo(52, 5));
  });

  it('cizgi her oge icin bir nokta uretir', () => {
    host.type.set('line');
    fixture.detectChanges();

    expect(chart.points().split(' ').length).toBe(3);
    expect(chart.points().startsWith('0.00,')).toBe(true);
  });

  it('alan tabandan baslayip tabanda biter', () => {
    host.type.set('area');
    fixture.detectChanges();

    const points = chart.areaPoints().split(' ');

    expect(points[0]).toBe('0,52');
    expect(points[points.length - 1]).toBe('100,52');
  });

  it('dilimler tam daireyi doldurur', () => {
    host.type.set('pie');
    fixture.detectChanges();

    const shares = chart.slices().map((slice) => slice.share);

    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(100, 5);
    expect(chart.slices().every((slice) => slice.path.startsWith('M'))).toBe(true);
  });

  it('halka dilimleri ic yaricap kullanir', () => {
    host.type.set('donut');
    fixture.detectChanges();

    expect(chart.slices()[0].path).toContain('A26 26');
  });

  it('tek oge dairesel turde tam daire olur', () => {
    host.type.set('pie');
    host.items.set([{ label: 'Ankara', value: 5 }]);
    fixture.detectChanges();

    expect(chart.single()).toBe(true);
    expect(fixture.debugElement.query(By.css('circle'))).toBeTruthy();
  });

  it('yigilmis parcalar yuzde yuze tamamlanir', () => {
    host.type.set('stacked');
    fixture.detectChanges();

    const segments = chart.segments();

    expect(segments.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5);
    expect(segments[1].start).toBeCloseTo(segments[0].width, 5);
  });

  it('pay hesabi yuvarlanir', () => {
    expect(chart.share(42)).toBe(42);
    expect(chart.share(0)).toBe(0);
  });

  it('veri yokken bos metin cikar, bolme hatasi olmaz', () => {
    host.items.set([]);
    fixture.detectChanges();

    expect(chart.total()).toBe(0);
    expect(chart.share(0)).toBe(0);
    expect(chart.points()).toBe('');
    expect(fixture.debugElement.query(By.css('.app-chart__empty'))).toBeTruthy();
  });

  it('tur degisince ayni veriyle yeniden cizilir', () => {
    const types: ChartType[] = ['bar', 'column', 'line', 'area', 'pie', 'donut', 'stacked'];

    types.forEach((type) => {
      host.type.set(type);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.app-chart'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.app-chart__empty'))).toBeNull();
    });
  });
});
