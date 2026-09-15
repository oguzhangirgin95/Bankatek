import { Component, DestroyRef, computed, forwardRef, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Açılır listede gösterilen tek bir sonuç. */
export interface SearchResult {
  /** Seçildiğinde dışarı verilen kimlik. */
  key: string;
  /** Listede görünen metin. */
  text: string;
  /** Metnin altındaki açıklama; verilmezse çizilmez. */
  hint?: string;
}

/**
 * Arama alanı.
 *
 * Yazarken değer anında `ngModel`'e yazılır ama `searched` çıkışı geciktirilir;
 * böylece her tuş vuruşunda servise istek gitmez. Enter beklemeyi iptal edip
 * hemen arar, Escape ve çarpı alanı temizler.
 *
 * `results` verilirse altında açılır liste çizilir; bileşen aramayı kendisi
 * yapmaz, sonucu dışarıdan alır.
 */
@Component({
  selector: 'app-search',
  host: { '[attr.id]': 'null' },
  imports: [FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Search), multi: true }],
})
export class Search extends BaseComponent implements ControlValueAccessor {
  readonly id = input<string>('');

  readonly label = input<string>('');

  readonly placeholder = input<string>('Ara');

  readonly disabled = input<boolean>(false);

  /** Yazma durduktan kaç milisaniye sonra aranacağı. */
  readonly delay = input<number>(300);

  /** Bu uzunluğun altında arama yapılmaz; boş değer her zaman bildirilir. */
  readonly minLength = input<number>(1);

  readonly results = input<SearchResult[]>([]);

  readonly emptyText = input<string>('Sonuç yok');

  /** Geciktirilmiş arama metni. */
  readonly searched = output<string>();

  readonly selected = output<SearchResult>();

  readonly cleared = output<void>();

  protected readonly value = signal<string>('');

  protected readonly open = signal<boolean>(false);

  private readonly formDisabled = signal<boolean>(false);

  protected readonly isDisabled = computed<boolean>(() => this.disabled() || this.formDisabled());

  protected readonly showResults = computed<boolean>(() => this.open() && this.value().length >= this.minLength());

  private timer?: ReturnType<typeof setTimeout>;

  private notifyChange: (value: any) => void = () => {};

  private notifyTouched: () => void = () => {};

  constructor() {
    super();

    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Yazılan değer. ngModel anında, arama gecikmeyle bildirilir. */
  protected type(next: string): void {
    this.value.set(next);
    this.notifyChange(next);
    this.open.set(true);

    this.stop();
    this.timer = setTimeout(() => this.emit(), this.delay());
  }

  /** Enter: beklemeyi iptal eder, hemen arar. */
  protected submit(): void {
    this.stop();
    this.emit();
  }

  protected clear(): void {
    this.stop();
    this.value.set('');
    this.notifyChange('');
    this.open.set(false);
    this.searched.emit('');
    this.cleared.emit();
  }

  protected choose(result: SearchResult): void {
    this.stop();
    this.value.set(result.text);
    this.notifyChange(result.text);
    this.open.set(false);
    this.selected.emit(result);
  }

  protected close(): void {
    this.open.set(false);
    this.notifyTouched();
  }

  /** Eşik altındaki metin aranmaz; boş değer listeyi sıfırlamak için geçer. */
  private emit(): void {
    const text = this.value();

    if (text.length === 0 || text.length >= this.minLength()) {
      this.searched.emit(text);
    }
  }

  private stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: any) => void): void {
    this.notifyChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
