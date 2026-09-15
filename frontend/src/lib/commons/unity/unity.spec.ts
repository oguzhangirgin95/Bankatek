import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Unity } from './unity';

@Component({
  imports: [Unity],
  template: '<app-unity [url]="address()" />',
})
class Host {
  readonly address = signal('/unity/');
}

describe('Unity adres korumasi', () => {
  let fixture: ComponentFixture<Host>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('<canvas id="unity-canvas"></canvas>') } as Response),
    );

    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(Host);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('baska bir sunucunun adresi icin istek bile atilmaz', async () => {
    fixture.componentInstance.address.set('https://saldirgan.example/unity/');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('javascript: adresi reddedilir', async () => {
    fixture.componentInstance.address.set('javascript:alert(1)');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('goreli adres kabul edilir', async () => {
    fixture.componentInstance.address.set('/unity/');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fetchMock).toHaveBeenCalledWith('/unity/', expect.anything());
  });

  it('cerceve adres dogrulanana kadar bos belge gosterir', () => {
    fixture.componentInstance.address.set('https://saldirgan.example/unity/');
    fixture.detectChanges();

    const frame = fixture.debugElement.query(By.css('iframe'));

    expect(frame).toBeTruthy();
    expect(frame.nativeElement.getAttribute('src')).toBe('about:blank');
  });
});
