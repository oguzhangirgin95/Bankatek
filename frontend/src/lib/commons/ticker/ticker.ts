import { Component, computed, input, output } from '@angular/core';

export interface TickerItem {
  text: string;
  key?: string;
}

@Component({
  selector: 'app-ticker',
  imports: [],
  templateUrl: './ticker.html',
  styleUrl: './ticker.scss',
})
export class Ticker {
  readonly label = input<string>('');

  readonly items = input<TickerItem[]>([]);

  readonly seconds = input<number>(24);

  readonly paused = input<boolean>(false);

  readonly itemClicked = output<TickerItem>();

  readonly loop = computed(() => [...this.items(), ...this.items()]);

  readonly duration = computed(() => `${this.seconds()}s`);
}
