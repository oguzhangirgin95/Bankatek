import { Component, DOCUMENT, afterNextRender, computed, inject, signal } from '@angular/core';
import { TourPosition } from '@lib/base/baseconfig/config';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { TourService } from '@lib/base/baseservice/tourservice';

/** Balonun genişliği. */
const WIDTH = 340;

/** Balon ile ekran kenarı arasındaki en küçük boşluk. */
const EDGE = 12;

/** Balon ile ışık arasındaki boşluk. */
const GAP = 14;

/** Değeri verilen aralığa çeker. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/**
 * Tanıtım turunun görünen yüzü: karartılmış zemin, hedefin üzerinde ışık ve
 * yanında balon. Durum tutmaz; ne gösterileceğini TourService söyler, buradaki
 * tek hesap balonun ekrana sığan bir yere konması.
 */
@Component({
  selector: 'app-tour',
  imports: [],
  templateUrl: './tour.html',
  styleUrl: './tour.scss',
  host: {
    '(window:resize)': 'readViewport()',
    '(document:keydown.escape)': 'tour.finish()',
  },
})
export class Tour extends BaseComponent {
  protected readonly tour = inject(TourService);

  private readonly document = inject(DOCUMENT);

  protected readonly title = computed<string>(() => this.tour.label(this.tour.step()?.title ?? ''));

  protected readonly text = computed<string>(() => this.tour.label(this.tour.step()?.text ?? ''));

  protected readonly labels = computed(() => ({
    next: this.getResource('TOUR_NEXT', 'İleri'),
    back: this.getResource('TOUR_BACK', 'Geri'),
    done: this.getResource('TOUR_DONE', 'Bitir'),
    hide: this.getResource('TOUR_HIDE', 'Bu ipuçlarını gizle'),
  }));

  private readonly viewport = signal<{ width: number; height: number }>({ width: 0, height: 0 });

  /**
   * Balonun yeri. Yapılandırmada position verilmemişse hedef ekranın alt
   * yarısındaysa üstüne, değilse altına konur.
   *
   * Üstte ve solda dururken balonu kendi boyu kadar geri kaydırmayı CSS
   * yaptığı için burada balonun ölçüsünü bilmeye gerek kalmıyor.
   */
  protected readonly card = computed(() => {
    const view = this.viewport();
    const box = this.tour.rect();
    const width = Math.min(WIDTH, Math.max(0, view.width - EDGE * 2));

    if (!box) {
      const position: TourPosition = 'bottom';

      return { top: Math.round(view.height / 3), left: Math.round((view.width - width) / 2), width, position };
    }

    const position =
      this.tour.step()?.position ?? (box.top + box.height > view.height / 2 ? 'top' : 'bottom');

    const top = position === 'top' ? box.top - GAP : position === 'bottom' ? box.top + box.height + GAP : box.top;

    // Solda balonun sağ kenarı hedefe dayanıyor, o yüzden sınır genişlik kadar içeride.
    const left =
      position === 'left'
        ? Math.max(EDGE + width, box.left - GAP)
        : position === 'right'
          ? Math.min(box.left + box.width + GAP, Math.max(EDGE, view.width - width - EDGE))
          : clamp(box.left + box.width / 2 - width / 2, EDGE, view.width - width - EDGE);

    return { top: Math.round(top), left: Math.round(left), width, position };
  });

  constructor() {
    super();

    // afterNextRender sunucuda çalışmaz, tarayıcıda da ancak hidrasyondan
    // sonra çalışır; turu açan tek yer burası.
    afterNextRender(() => {
      this.readViewport();
      this.tour.enable();
    });
  }

  protected readViewport(): void {
    const view = this.document.defaultView;

    if (view) {
      this.viewport.set({ width: view.innerWidth, height: view.innerHeight });
    }
  }
}
