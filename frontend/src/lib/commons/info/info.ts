import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Renk çeşidi.
 *
 * İlk dördü anlamsaldır: bilgi, başarılı, uyarı, hata. Teal ve violet ise
 * anlam taşımaz; aynı ekranda altı ayrı öğeyi birbirinden ayırt edebilmek
 * için eklendi (dört renkle iki kart aynı renge düşüyordu).
 *
 * Her değer temadaki --color-<ad> değişkenine karşılık gelir.
 */
export type InfoVariant = 'info' | 'success' | 'warning' | 'error' | 'teal' | 'violet';

/** Kullanıcıya kısa bir bilgi ya da uyarı gösteren şerit. */
@Component({
  selector: 'app-info',
  imports: [],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info extends BaseComponent {
  /** Gösterilecek metin. */
  readonly message = input<string>('');

  /** Mesajın tonu; şeridin rengini belirler. */
  readonly variant = input<InfoVariant>('info');
}
