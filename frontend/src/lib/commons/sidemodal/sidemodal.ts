import { Component, DOCUMENT, DestroyRef, effect, inject, input, model } from '@angular/core';

@Component({
  selector: 'app-sidemodal',
  imports: [],
  templateUrl: './sidemodal.html',
  styleUrl: './sidemodal.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Sidemodal {
  private readonly document = inject(DOCUMENT);

  readonly title = input<string>('');

  readonly width = input<number>(420);

  readonly open = model<boolean>(false);

  constructor() {
    effect(() => this.document.body.classList.toggle('app-modal-open', this.open()));

    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('app-modal-open'));
  }

  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }
}
