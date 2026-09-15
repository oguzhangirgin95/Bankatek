import { Component, input, output, signal } from '@angular/core';

export interface ProfileItem {
  key: string;
  text: string;
  icon?: string;
}

const ICONS: Record<string, string> = {
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
};

@Component({
  selector: 'app-profilemenu',
  imports: [],
  templateUrl: './profilemenu.html',
  styleUrl: './profilemenu.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class Profilemenu {
  readonly primary = input<string>('');

  readonly group = input<string>('');

  readonly items = input<ProfileItem[]>([]);

  readonly primaryClicked = output<void>();

  readonly selected = output<string>();

  readonly open = signal(false);

  icon(name: string): string {
    return ICONS[name] ?? '';
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  choose(key: string): void {
    this.close();
    this.selected.emit(key);
  }

  run(): void {
    this.close();
    this.primaryClicked.emit();
  }
}
