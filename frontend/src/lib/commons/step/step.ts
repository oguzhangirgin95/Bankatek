import { Component, computed, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Şeritteki tek bir adım. */
export interface StepItem {
  /** Adımın kimliği; akıştan gelenlerde route path'i ile aynıdır. */
  id: string;
  /** Şeritte yazan başlık. */
  title: string;
}

/** Adımın şeritteki hali: geçilmiş, bulunulan ya da sıradaki. */
export type StepState = 'done' | 'active' | 'next';

/** Şeride çizilen, durumu hesaplanmış adım. */
interface StepView extends StepItem {
  /** Kullanıcıya gösterilen sıra numarası; 1'den başlar. */
  order: number;
  /** Adımın hali. */
  state: StepState;
  /**
   * Ekran okuyucunun okuduğu sıra ve hal metni: 'Adım 2, bu adımda'.
   *
   * Tik ve renk sessiz kalıyor, geçilmiş adımda numaranın yerini de tik aldığı
   * için sıra yalnızca burada söyleniyor.
   */
  stateText: string;
}

/**
 * Akışın neresinde olunduğunu gösteren adım şeridi.
 *
 * Adımlar verilmezse yapılandırmadan okunur: FlowService zaten hangi adımların
 * olduğunu ve hangisinde bulunulduğunu biliyor, dolayısıyla çok adımlı bir
 * akışa şerit eklemek için ekranda bir şey yazmak gerekmiyor. Tek adımlı
 * transaction'larda şerit kendini hiç çizmez.
 *
 * Şerit tıklanabilir değil: sonuç adımından geri dönüş yapılandırmada
 * kapatılıyor (showBackButton: false) ve onay adımı açılırken servisini
 * yeniden çağırıyor. Adıma tıklayarak atlamak bu iki kararı da delerdi;
 * gezinme ileri/geri butonlarında kalıyor.
 */
@Component({
  selector: 'app-step',
  imports: [],
  templateUrl: './step.html',
  styleUrl: './step.scss',
})
export class Step extends BaseComponent {
  /** Gösterilecek adımlar. Boş bırakılırsa akış yapılandırmasındaki adımlar çizilir. */
  readonly steps = input<StepItem[]>([]);

  /** Bulunulan adımın kimliği. Boş bırakılırsa akıştaki geçerli adım kullanılır. */
  readonly active = input<string>('');

  /** Şeridin metinleri. */
  private readonly labels = computed(() => ({
    order: this.getResource('STEP_ORDER', 'Adım'),
    done: this.getResource('STEP_DONE', 'tamamlandı'),
    active: this.getResource('STEP_ACTIVE', 'bu adımda'),
    next: this.getResource('STEP_NEXT', 'sıradaki'),
    label: this.getResource('STEP_LABEL', 'Akış adımları'),
  }));

  /** Şeridin ekran okuyucuya verdiği ad. */
  protected readonly label = computed(() => this.labels().label);

  /**
   * Çizilecek adımlar.
   *
   * Yapılandırmadan gelen başlık 'ANAHTAR | varsayılan metin' biçimini
   * destekler; başlık hiç verilmemişse sıra numarasına düşülür, böylece
   * başlık tanımlamayan bir akışta da şerit anlamlı kalır.
   */
  private readonly list = computed<StepItem[]>(() => {
    const given = this.steps();
    if (given.length > 0) {
      return given;
    }

    return this.flowService
      .steps()
      .map((step, index) => ({
        id: step.step,
        title: this.flowService.resolveText(step.title ?? '') || `${this.labels().order} ${index + 1}`,
      }));
  });

  /**
   * Bulunulan adımın sırası.
   *
   * Adım listede bulunamazsa (derin bağlantı, bayrakla kapatılmış adım) ilk
   * adım bulunulan adım sayılır; şerit boş bir halde kalmaz.
   */
  private readonly activeIndex = computed<number>(() => {
    const active = this.active() || this.currentStep();
    const index = this.list().findIndex((item) => item.id === active);

    return index < 0 ? 0 : index;
  });

  /** Şeride çizilecek adımlar, halleriyle. */
  protected readonly items = computed<StepView[]>(() => {
    const labels = this.labels();
    const active = this.activeIndex();

    return this.list().map((item, index) => {
      const state: StepState = index < active ? 'done' : index === active ? 'active' : 'next';

      return { ...item, order: index + 1, state, stateText: `${labels.order} ${index + 1}, ${labels[state]}` };
    });
  });

  /** Tek adımlık akışta şerit bir şey anlatmaz, hiç çizilmez. */
  protected readonly visible = computed<boolean>(() => this.items().length > 1);
}
