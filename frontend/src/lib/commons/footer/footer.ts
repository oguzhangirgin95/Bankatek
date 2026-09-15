import { Component } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Sayfanın alt bandı. Telif bilgisi dışında bir işlevi yoktur. */
@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer extends BaseComponent {
  /** Telif yılı. Sabit yazmak yerine hesaplanır ki her yıl güncellenmesi gerekmesin. */
  readonly year = new Date().getFullYear();
}
