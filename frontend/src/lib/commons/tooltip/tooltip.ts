import { Component, input } from '@angular/core';

/** İpucunun içeriği ve ekrandaki konumu. */
export interface TooltipState {
  /** Gösterilecek metin. Boşsa ipucu görünmez. */
  text: string;
  /** Farenin yatay konumu; olaydaki clientX doğrudan aktarılır. */
  x: number;
  /** Farenin dikey konumu; olaydaki clientY doğrudan aktarılır. */
  y: number;
}

/** Gizli durum. Grafikler fare ayrılınca bu değere döner. */
export const TOOLTIP_HIDDEN: TooltipState = { text: '', x: 0, y: 0 };

/**
 * Fareyi takip eden ipucu.
 *
 * Kendi fare olaylarını dinlemez, durumu dışarıdan alır. Bunun sebebi SVG
 * içindeki path ve circle gibi öğelerin de ipucu gösterebilmesi; onları
 * saran bir bileşen yazmak yerine durum yukarıda tutuluyor.
 */
@Component({
  selector: 'app-tooltip',
  imports: [],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
})
export class Tooltip {
  /** Ne yazacağı ve nerede duracağı. */
  readonly state = input<TooltipState>(TOOLTIP_HIDDEN);
}
