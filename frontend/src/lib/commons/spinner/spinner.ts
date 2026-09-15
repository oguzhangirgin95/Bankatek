import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Dönen yükleniyor göstergesi. Ne kadar süreceği bilinmeyen işlemler için;
 * yerini bilinen bir içerik doldurulacaksa Skeleton daha uygun.
 */
@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
})
export class Spinner extends BaseComponent {
  /** Göstergenin yanında görünecek açıklama. Boş bırakılabilir. */
  readonly text = input<string>('');

  /** Çap, piksel. */
  readonly size = input<number>(24);
}
