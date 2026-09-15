import { Component, input, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Hareketli görsel (GIF). Animasyon dosyanın kendisinde; bileşen yalnızca
 * gösterir, kod tarafında animasyon yok.
 *
 * Boyutu çağıran ekran verir (host'a genişlik yazmak yeterli); verilmezse
 * GIF kendi boyunda, kabı taşmadan çizilir. Dosya yüklenemezse kırık resim
 * ikonu yerine hiçbir şey görünmez.
 */
@Component({
  selector: 'app-gif',
  imports: [],
  templateUrl: './gif.html',
  styleUrl: './gif.scss',
})
export class Gif extends BaseComponent {
  /** GIF'in adresi. */
  readonly src = input.required<string>();

  /** Ekran okuyucu için açıklama; süs amaçlıysa boş bırakılır. */
  readonly alt = input<string>('');

  /** Dosya yüklenemedi mi. */
  protected readonly failed = signal(false);
}
