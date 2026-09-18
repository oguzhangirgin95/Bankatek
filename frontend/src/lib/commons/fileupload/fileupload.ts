import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Validation } from '../validation/validation';

/** Seçilmiş tek bir dosya. */
export interface UploadFile {
  /** Tarayıcıdan gelen asıl dosya; isteği atacak ekran bunu gönderir. */
  file: File;
  /** Dosyanın adı, uzantısıyla birlikte. */
  name: string;
  /** Bayt cinsinden boyut; sınır denetimi ve okunur metin bundan üretilir. */
  bytes: number;
  /** Küçük harfli uzantı: 'pdf', 'xlsx'. Uzantısız dosyada boş kalır. */
  extension: string;
}

/** Elenen dosya ve eleme sebebi. */
interface RejectedFile {
  name: string;
  reason: string;
}

/** Kabul edilen varsayılan türler. Bankacılık ekranlarında tipik olanlar. */
const DEFAULT_ACCEPT = '.pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg';

/** Rozetin rengini belirleyen türler; uzantıdan bulunur. */
const KINDS: Record<string, string> = {
  pdf: 'pdf',
  xls: 'sheet',
  xlsx: 'sheet',
  csv: 'sheet',
  doc: 'word',
  docx: 'word',
  txt: 'word',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
};

/** Bir megabaytın baytı; sınır megabayt verildiği için çevrim gerekiyor. */
const MB = 1024 * 1024;

/** Dosyanın küçük harfli uzantısı. Nokta yoksa boş döner. */
function extensionOf(name: string): string {
  const at = name.lastIndexOf('.');

  return at < 0 ? '' : name.slice(at + 1).toLocaleLowerCase('tr');
}

/**
 * Etiketli dosya yükleme alanı.
 *
 * Dosyalar sürüklenip bırakılarak ya da alana tıklanıp seçilerek eklenir;
 * tür, boyut ve adet sınırını geçemeyenler listeye girmez ve sebebiyle
 * birlikte altta yazılır.
 *
 * Input ve Select gibi ControlValueAccessor uygular, yani
 * `[(ngModel)]="State.Request.files"` ile bağlanır ve yapılandırmadaki
 * Required kuralı boş listeyi yakalar. Dosyaları sunucuya göndermek bileşenin
 * işi değil: hangi uca, hangi gövdeyle gideceğine ekran karar verir, burada
 * yalnızca asıl File nesneleri elde tutulur.
 */
@Component({
  selector: 'app-fileupload',
  host: { '[attr.id]': 'null' },
  imports: [Validation],
  templateUrl: './fileupload.html',
  styleUrl: './fileupload.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Fileupload), multi: true }],
})
export class Fileupload extends BaseComponent implements ControlValueAccessor {
  /** Alan kimliği; etiket eşleşmesi ve doğrulama hatası bu id ile bulunur. */
  readonly id = input<string>('');

  /** Alanın üstünde görünen etiket. Boşsa etiket çizilmez. */
  readonly label = input<string>('');

  /** Kabul edilen uzantılar, '.pdf,.xlsx' biçiminde. */
  readonly accept = input<string>(DEFAULT_ACCEPT);

  /** Birden çok dosya seçilebilir mi. */
  readonly multiple = input(true, { transform: booleanAttribute });

  /** Dosya başına üst sınır, megabayt. */
  readonly maxSize = input(10, { transform: numberAttribute });

  /** En fazla kaç dosya eklenebilir. 0 verilirse sınır yok. */
  readonly maxCount = input(5, { transform: numberAttribute });

  /** Pasif alana dosya eklenemez ve soluk görünür. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Eklenmiş dosyalar. ngModel yazar, şablon okur. */
  protected readonly files = signal<UploadFile[]>([]);

  /** Son denemede elenen dosyalar; yeni denemede sıfırlanır. */
  protected readonly rejected = signal<RejectedFile[]>([]);

  /** Dosya alanın üzerine sürükleniyor mu. */
  protected readonly over = signal(false);

  /** Forms API'nin kapattığı durum; [disabled] girdisinden ayrı tutulur. */
  private readonly formDisabled = signal(false);

  /** İkisinden biri kapattıysa alan pasiftir. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** Gizli dosya seçici; alana tıklanınca bu açılır. */
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  /** ngModel'in bağladığı bildiriciler; bağlanmadan önce boş dururlar. */
  private notifyChange: (value: any) => void = () => {};

  private notifyTouched: () => void = () => {};

  /** Ekran metinleri. */
  protected readonly labels = computed(() => ({
    drop: this.getResource('FILEUPLOAD_DROP', 'Dosyaları buraya sürükleyin'),
    browse: this.getResource('FILEUPLOAD_BROWSE', 'ya da seçmek için tıklayın'),
    remove: this.getResource('FILEUPLOAD_REMOVE', 'Kaldır'),
    empty: this.getResource('FILEUPLOAD_EMPTY', 'Henüz dosya eklenmedi'),
  }));

  /** Eleme sebepleri. */
  private readonly reasons = computed(() => ({
    type: this.getResource('FILEUPLOAD_REASON_TYPE', 'tür kabul edilmiyor'),
    size: this.getResource('FILEUPLOAD_REASON_SIZE', 'boyut sınırını aşıyor'),
    count: this.getResource('FILEUPLOAD_REASON_COUNT', 'dosya sayısı sınırı dolu'),
    duplicate: this.getResource('FILEUPLOAD_REASON_DUPLICATE', 'aynı dosya zaten ekli'),
  }));

  /** Kabul edilen uzantılar, noktasız ve küçük harfli. */
  private readonly accepted = computed<string[]>(() =>
    this.accept()
      .split(',')
      .map((part) => part.trim().replace(/^\./, '').toLocaleLowerCase('tr'))
      .filter((part) => part !== ''),
  );

  /** Alanın altındaki kural özeti: hangi türler, hangi sınırlar. */
  protected readonly hint = computed<string>(() => {
    const parts = [this.accepted().map((item) => item.toLocaleUpperCase('tr')).join(', ')];

    parts.push(`${this.getResource('FILEUPLOAD_MAXSIZE', 'en çok')} ${this.maxSize()} MB`);

    if (this.maxCount() > 0) {
      parts.push(`${this.getResource('FILEUPLOAD_MAXCOUNT', 'en fazla')} ${this.maxCount()} ${
        this.getResource('FILEUPLOAD_FILE', 'dosya')
      }`);
    }

    return parts.join(' · ');
  });

  /** Dosyanın rozet türü; tanınmayan uzantı nötr renkte kalır. */
  protected kind(extension: string): string {
    return KINDS[extension] ?? 'other';
  }

  /** Boyutu okunur hale getirir: '842 KB', '1,4 MB'. */
  protected size(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    const value = kb < 1024 ? kb : kb / 1024;

    return `${value.toFixed(1).replace('.', ',')} ${kb < 1024 ? 'KB' : 'MB'}`;
  }

  /** Gizli seçiciyi açar. */
  protected browse(): void {
    if (!this.isDisabled()) {
      this.picker().nativeElement.click();
    }
  }

  /**
   * Seçiciden gelen dosyalar.
   *
   * Seçicinin değeri sıfırlanıyor: kaldırılan bir dosya yeniden seçilmek
   * istendiğinde tarayıcı aynı değeri değişmemiş sayıp olay üretmiyor.
   */
  protected onPicked(event: Event): void {
    const field = event.target as HTMLInputElement;

    this.add(field.files);
    field.value = '';
  }

  /** Sürüklenen dosya alanın üzerinde; bırakmaya izin verildiği belirtiliyor. */
  protected onDragOver(event: DragEvent): void {
    if (this.isDisabled()) {
      return;
    }

    event.preventDefault();
    this.over.set(true);
  }

  protected onDragLeave(): void {
    this.over.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.isDisabled()) {
      return;
    }

    event.preventDefault();
    this.over.set(false);
    this.add(event.dataTransfer?.files ?? null);
  }

  /** Listeden çıkarır. */
  protected remove(index: number): void {
    this.publish(this.files().filter((item, at) => at !== index));
  }

  /**
   * Gelen dosyaları sınırlardan geçirip listeye ekler.
   *
   * Eleme sırası önemli: sayı sınırı en sonda denetleniyor, böylece sınırı
   * dolduran dosya "tür kabul edilmiyor" yerine doğru sebebi alıyor.
   */
  private add(list: FileList | null): void {
    if (!list || list.length === 0) {
      return;
    }

    const accepted = this.accepted();
    const limit = this.maxSize() * MB;
    const reasons = this.reasons();
    const next = this.multiple() ? [...this.files()] : [];
    const rejected: RejectedFile[] = [];

    for (const file of Array.from(list)) {
      const extension = extensionOf(file.name);

      if (accepted.length > 0 && !accepted.includes(extension)) {
        rejected.push({ name: file.name, reason: reasons.type });
        continue;
      }

      if (file.size > limit) {
        rejected.push({ name: file.name, reason: reasons.size });
        continue;
      }

      if (next.some((item) => item.name === file.name && item.bytes === file.size)) {
        rejected.push({ name: file.name, reason: reasons.duplicate });
        continue;
      }

      if (this.maxCount() > 0 && next.length >= this.maxCount()) {
        rejected.push({ name: file.name, reason: reasons.count });
        continue;
      }

      next.push({ file, name: file.name, bytes: file.size, extension });

      // Tek dosyalık alanda sonradan gelen öncekinin yerine geçer; listede
      // ikisi birden durmamalı.
      if (!this.multiple()) {
        break;
      }
    }

    this.rejected.set(rejected);
    this.publish(next);
  }

  /** Listeyi hem ekrana hem dışarıdaki ngModel'e yazar. */
  private publish(next: UploadFile[]): void {
    this.files.set(next);
    this.notifyChange(next);
    this.notifyTouched();
  }

  /** ngModel'den gelen değeri ekrana yazar. Liste değilse boş kabul edilir. */
  writeValue(value: any): void {
    this.files.set(Array.isArray(value) ? value : []);
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
