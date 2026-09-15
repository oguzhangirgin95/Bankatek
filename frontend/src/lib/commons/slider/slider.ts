import { Component, DestroyRef, afterNextRender, computed, inject, input, model, output, signal } from '@angular/core';

export interface SliderItem {
  title: string;
  text?: string;
  imageUrl?: string;
  key?: string;
}

@Component({
  selector: 'app-slider',
  imports: [],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
})
export class Slider {
  readonly items = input<SliderItem[]>([]);

  readonly perView = input<number>(3);

  readonly emptyText = input<string>('Kayıt yok');

  readonly index = model<number>(0);

  readonly itemClicked = output<SliderItem>();

  /** Dar ekranda uc kart sigmaz; metin satirlara bolunur. */
  private readonly narrow = signal(false);

  /** Ayni anda gorunen kart sayisi. */
  readonly visible = computed(() => (this.narrow() ? 1 : this.perView()));

  readonly pages = computed(() => Math.max(1, this.items().length - this.visible() + 1));

  readonly offset = computed(
    () => `translateX(-${(Math.min(this.index(), this.pages() - 1) * 100) / this.visible()}%)`,
  );

  readonly width = computed(() => `${100 / this.visible()}%`);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const query = window.matchMedia('(max-width: 640px)');
      const read = () => this.narrow.set(query.matches);

      read();
      query.addEventListener('change', read);
      destroyRef.onDestroy(() => query.removeEventListener('change', read));
    });
  }

  back(): void {
    this.index.update((value) => (value > 0 ? value - 1 : this.pages() - 1));
  }

  next(): void {
    this.index.update((value) => (value < this.pages() - 1 ? value + 1 : 0));
  }
}
