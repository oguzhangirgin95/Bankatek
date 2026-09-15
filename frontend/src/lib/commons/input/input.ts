import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Validation } from '../validation/validation';

/**
 * Etiketli metin girişi. Doğrulama mesajını kendi altında gösterir.
 *
 * ControlValueAccessor uyguladığı için ngModel ile iki yönlü bağlanır:
 * `[(ngModel)]="State.Request.username"` yazmak yeterli, ekranın değeri elle
 * taşıyan bir metot yazmasına gerek kalmaz. Değişimde ek bir iş yapılacaksa
 * (liste yenilemek gibi) ekran ayrıca (ngModelChange) dinler.
 *
 * Değeri yalnızca göstermek için tutar; asıl sahibi bağlanan ifadedir.
 * Gecikme gerekiyorsa (arama alanlarında olduğu gibi) bunu çağıran ekran
 * ayarlar, bileşen karışmaz.
 *
 * host'ta id null'a çekiliyor çünkü id'nin asıl sahibi içerideki <input>
 * elemanı; aksi halde hem sarmalayıcıda hem input'ta aynı id olur, <label for>
 * eşleşmesi ve doğrulama hedefi şaşar.
 */
@Component({
  selector: 'app-input',
  host: { '[attr.id]': 'null' },
  imports: [FormsModule, Validation],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Input), multi: true }],
})
export class Input extends BaseComponent implements ControlValueAccessor {
  /** Alan kimliği; etiket eşleşmesi ve doğrulama hatası bu id ile bulunur. */
  readonly id = input<string>('');

  /** Alanın üstünde görünen etiket. Boşsa etiket çizilmez. */
  readonly label = input<string>('');

  /** HTML input türü: text, password, number, date gibi. */
  readonly type = input<string>('text');

  /** Pasif alan yazılamaz ve soluk görünür. */
  readonly disabled = input<boolean>(false);

  /** Ekranda görünen değer. ngModel yazar, şablon okur. */
  protected readonly value = signal<string>('');

  /** Forms API'nin kapattığı durum; [disabled] girdisinden ayrı tutulur. */
  private readonly formDisabled = signal<boolean>(false);

  /** İkisinden biri kapattıysa alan pasiftir. */
  protected readonly isDisabled = computed<boolean>(() => this.disabled() || this.formDisabled());

  private readonly element = inject(ElementRef);

  /** ngModel'in bağladığı bildiriciler; bağlanmadan önce boş dururlar. */
  private notifyChange: (value: any) => void = () => {};

  private notifyTouched: () => void = () => {};

  /** Tarayıcı otomatik doldurmasını yakalamak için ilk çizim sonrası kontrol kurar. */
  constructor() {
    super();

    // Tarayıcının şifre/adres otomatik doldurması alanı ilk çizimden sonra
    // doldurabiliyor ve bu bir input olayı üretmiyor. Kontrol edilmezse
    // kullanıcı dolu bir formu gönderiyor ama bizim elimizdeki değer boş
    // kalıyor; o yüzden ilk çizimden sonra bir kez karşılaştırıp bildiriyoruz.
    afterNextRender(() => {
      const field = this.element.nativeElement.querySelector('input') as HTMLInputElement | null;

      if (field && field.value !== this.value()) {
        this.publish(field.value);
      }
    });
  }

  /** Alandan çıkıldığında dokunuldu bilgisini iletir. */
  onBlur() {
    this.notifyTouched();
  }

  /** ngModel'den gelen değeri ekrana yazar. Boş değerler boş metne düşer. */
  writeValue(value: any): void {
    this.value.set(value === null || value === undefined ? '' : String(value));
  }

  registerOnChange(fn: (value: any) => void): void {
    this.notifyChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /**
   * İçerideki alandan gelen değeri hem ekrana hem dışarıdaki ngModel'e yazar.
   *
   * type="number" alanlarda metin yerine sayı bildirilir; Angular'ın kendi
   * sayı erişimcisi de böyle yapar ve durumda '20' yerine 20 kalır. İçerideki
   * erişimci her zaman metin verdiği için çevrim burada yapılıyor: type bir
   * girdi olduğundan derleme anında sabit değil, Angular'ın sayı erişimcisi
   * hiçbir zaman eşleşmez.
   */
  protected publish(value: string): void {
    this.value.set(value);

    if (this.type() !== 'number') {
      this.notifyChange(value);
      return;
    }

    this.notifyChange(value === '' ? null : Number(value));
  }
}
