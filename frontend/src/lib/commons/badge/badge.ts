import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { InfoVariant } from '../info/info';

/**
 * Küçük durum etiketi. Tablo hücrelerinde ve kart başlıklarında bir kaydın
 * durumunu renkle vurgulamak için kullanılır.
 */
@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge extends BaseComponent {
  /** Etiketin üzerindeki yazı. */
  readonly text = input<string>('');

  /** Renk çeşidi; temadaki --color-<variant> değişkenine karşılık gelir. */
  readonly variant = input<InfoVariant>('info');
}
