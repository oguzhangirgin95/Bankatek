import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Validation } from '../validation/validation';

/** Açılır listedeki tek seçenek. */
export interface SelectOption {
  /** Seçildiğinde dışarı verilen değer. */
  value: string;
  /** Kullanıcının gördüğü metin. */
  text: string;
}

/**
 * Etiketli açılır liste. Doğrulama mesajını kendi altında gösterir.
 *
 * Input gibi ControlValueAccessor uygular; ngModel ile iki yönlü bağlanır ve
 * seçim değiştiğinde ek iş gerekiyorsa ekran (ngModelChange) dinler.
 *
 * Seçili değeri yalnızca göstermek için tutar; asıl sahibi bağlanan ifadedir.
 *
 * İçerideki <select> de ngModel kullanır. Bunun elle seçili işaretlemeye göre
 * asıl faydası şu: seçenekler çoğu ekranda servisten sonradan geliyor ve
 * Angular'ın liste erişimcisi yeni seçenek eklendiğinde seçili değeri kendisi
 * yeniden uyguluyor.
 *
 * host'ta id null'a çekiliyor çünkü id'nin asıl sahibi içerideki <select>
 * elemanı; aksi halde <label for> eşleşmesi ve doğrulama hedefi şaşar.
 */
@Component({
  selector: 'app-select',
  host: { '[attr.id]': 'null' },
  imports: [FormsModule, Validation],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select extends BaseComponent implements ControlValueAccessor {
  /** Alan kimliği; etiket eşleşmesi ve doğrulama hatası bu id ile bulunur. */
  readonly id = input<string>('');

  /** Alanın üstünde görünen etiket. Boşsa etiket çizilmez. */
  readonly label = input<string>('');

  /** Seçenekler, verildikleri sırayla listelenir. */
  readonly options = input<SelectOption[]>([]);

  /** Boş seçeneğin metni, örneğin "Tümü". Filtrelerde "hepsi" anlamına gelir. */
  readonly placeholder = input<string>('');

  /** Pasif alan açılmaz ve soluk görünür. */
  readonly disabled = input<boolean>(false);

  /** Seçili seçeneğin değeri. Boş metin, placeholder seçeneğine karşılık gelir. */
  protected readonly value = signal<string>('');

  /** Forms API'nin kapattığı durum; [disabled] girdisinden ayrı tutulur. */
  private readonly formDisabled = signal<boolean>(false);

  /** İkisinden biri kapattıysa alan pasiftir. */
  protected readonly isDisabled = computed<boolean>(() => this.disabled() || this.formDisabled());

  /** ngModel'in bağladığı bildiriciler; bağlanmadan önce boş dururlar. */
  private notifyChange: (value: any) => void = () => {};

  private notifyTouched: () => void = () => {};

  /** İçerideki listeden gelen seçimi hem ekrana hem dışarıdaki ngModel'e yazar. */
  protected publish(value: string) {
    this.value.set(value);
    this.notifyChange(value);
  }

  /** Alandan çıkıldığında dokunuldu bilgisini iletir. */
  onBlur() {
    this.notifyTouched();
  }

  /**
   * ngModel'den gelen değeri yazar.
   *
   * Seçenek değerleri her zaman metindir; durumda sayı tutulan alanlar da
   * (sayfa boyutu gibi) doğru seçeneğe denk gelsin diye metne çevriliyor.
   */
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
}
