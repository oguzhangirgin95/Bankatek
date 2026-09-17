import { Component, ViewEncapsulation, input, numberAttribute } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * İçine konanları yan yana dizer.
 *
 * `row` satırın kaç paya bölüneceğini söyler; her öğe bir pay, `<app-column
 * column="2">` iki pay kaplar ve paylar dolunca sonraki öğe alt satıra geçer.
 * Verilmezse bütün öğeler tek satırı eşit paylaşır. Bir pay çok daralırsa
 * öğe yine alt satıra iner; dar ekranda bu yüzden ekranın media query
 * yazması gerekmez.
 *
 * Stil kapsüllenmiyor, çünkü kurallar ng-content ile gelen çocuklara işlemeli;
 * kapsüllenmiş stil onlara ulaşmıyor.
 */
@Component({
  selector: 'app-row',
  imports: [],
  templateUrl: './row.html',
  styleUrl: './row.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Row extends BaseComponent {
  /** Satırın bölüneceği pay sayısı. 0 ise öğeler tek satırı paylaşır. */
  readonly row = input(0, { transform: numberAttribute });
}
