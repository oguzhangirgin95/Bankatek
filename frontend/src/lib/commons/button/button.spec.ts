import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { FlowButtonVariant } from '@lib/base/baseconfig/config';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<app-button [id]="id()" [cssClass]="cssClass()" [variant]="variant()" label="Sil" />`,
})
class Host {
  readonly id = signal('deleteButton');
  readonly cssClass = signal('');
  readonly variant = signal<FlowButtonVariant>('primary');
}

describe('Button', () => {
  let fixture: ComponentFixture<Host>;

  const host = (): HTMLElement => fixture.debugElement.query(By.css('app-button')).nativeElement;

  const button = (): HTMLButtonElement => fixture.debugElement.query(By.css('button')).nativeElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('id icteki butona konur, sarmalayicida kalmaz', () => {
    expect(button().id).toBe('deleteButton');
    expect(host().hasAttribute('id')).toBe(false);
  });

  it('id bossa bos id yazilmaz', () => {
    fixture.componentInstance.id.set('');
    fixture.detectChanges();

    expect(button().hasAttribute('id')).toBe(false);
  });

  it('cssClass mevcut siniflarin yanina eklenir', () => {
    fixture.componentInstance.cssClass.set('my-btn other');
    fixture.componentInstance.variant.set('outline');
    fixture.detectChanges();

    const classes = button().classList;
    expect(classes.contains('app-button')).toBe(true);
    expect(classes.contains('app-button--outline')).toBe(true);
    expect(classes.contains('my-btn')).toBe(true);
    expect(classes.contains('other')).toBe(true);
  });
});
