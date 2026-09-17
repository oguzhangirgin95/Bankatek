import { Component, ViewEncapsulation, input, numberAttribute } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * İçine konanları alt alta, aralarında boşlukla dizer.
 *
 * app-row içinde bir hücre gibi davranır; `column` o satırda kaç pay
 * kaplayacağını söyler. column="2" yanındaki tek paylı öğenin iki katı yer alır.
 *
 * Stil kapsüllenmiyor, çünkü satır ve iç içe yerleşim kuralları çocuklara işlemeli.
 */
@Component({
  selector: 'app-column',
  imports: [],
  templateUrl: './column.html',
  styleUrl: './column.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Column extends BaseComponent {
  /** app-row içinde kaplanacak pay. Satır dışında etkisi yok. */
  readonly column = input(1, { transform: numberAttribute });
}
