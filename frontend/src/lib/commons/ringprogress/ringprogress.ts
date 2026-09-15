import { Component, computed, input } from '@angular/core';
import { InfoVariant } from '../info/info';

const RADIUS = 42;

@Component({
  selector: 'app-ringprogress',
  imports: [],
  templateUrl: './ringprogress.html',
  styleUrl: './ringprogress.scss',
})
export class Ringprogress {
  readonly label = input<string>('');

  readonly value = input<number>(0);

  readonly max = input<number>(100);

  readonly size = input<number>(120);

  readonly variant = input<InfoVariant>('info');

  readonly showValue = input<boolean>(true);

  readonly radius = RADIUS;

  readonly circumference = 2 * Math.PI * RADIUS;

  readonly ratio = computed(() => {
    const max = this.max() || 1;

    return Math.min(1, Math.max(0, this.value() / max));
  });

  readonly dashOffset = computed(() => this.circumference * (1 - this.ratio()));

  readonly percent = computed(() => Math.round(this.ratio() * 100));
}
