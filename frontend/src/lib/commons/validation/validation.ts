import { Component, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Bir alanın doğrulama hatasını gösterir.
 *
 * Hatayı kendisi hesaplamaz; alan id'siyle FlowService'e sorar. Hata yoksa
 * hiçbir şey çizmez, dolayısıyla alanın altında boş yer kaplamaz.
 */
@Component({
  selector: 'app-validation',
  imports: [],
  templateUrl: './validation.html',
  styleUrl: './validation.scss',
})
export class Validation extends BaseComponent {
  /** Hatası gösterilecek alanın id'si; doğrulama kuralındaki id ile aynı olmalı. */
  readonly id = input<string>('');
}
