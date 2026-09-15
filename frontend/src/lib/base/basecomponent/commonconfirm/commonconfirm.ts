import { Component, computed } from '@angular/core';
import { BaseComponent } from '../basecomponent';

/**
 * Yapılandırmadan gelen onay adımı.
 *
 * Kendine ait bir alanı yoktur; State'teki 'confirmResponse' nesnesini
 * anahtar/değer listesine çevirip gösterir. Böylece basit onay ekranları
 * için ayrı bir bileşen yazmaya gerek kalmıyor.
 */
@Component({
  imports: [],
  templateUrl: './commonconfirm.html',
  styleUrl: './commonconfirm.scss',
})
export class Commonconfirm extends BaseComponent {
  /** Yanıt nesnesini ekranda listelenecek satırlara çevirir. */
  readonly items = computed(() => {
    const response = this.flowService.get<Record<string, any>>('confirmResponse') ?? {};
    return Object.entries(response).map(([key, value]) => ({ key, value }));
  });
}
