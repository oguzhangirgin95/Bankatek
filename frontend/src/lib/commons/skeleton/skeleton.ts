import { Component, computed, input } from '@angular/core';

/**
 * Yükleniyor iskeleti. Veri gelene kadar içeriğin yerini tutan gri şeritler
 * çizer, böylece istek tamamlandığında sayfa zıplamaz.
 *
 * Hiçbir servise ihtiyacı olmadığı için BaseComponent'i genişletmeyen tek
 * bileşen budur.
 */
@Component({
  selector: 'app-skeleton',
  imports: [],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
})
export class Skeleton {
  /** Kaç şerit çizileceği. Yerini tuttuğu içeriğe göre ayarlanır. */
  readonly lines = input<number>(1);

  /** Tek şeridin yüksekliği, piksel. */
  readonly height = input<number>(14);

  /** Şablonda döngü kurabilmek için satır indeksleri; değerlerin bir anlamı yok. */
  readonly rows = computed(() => Array.from({ length: this.lines() }, (value, index) => index));
}
