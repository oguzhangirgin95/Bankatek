import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { environment } from '@env/environment';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Validation } from '../validation/validation';

export type DatepickerMode = 'date' | 'datetime' | 'time';

type DatepickerView = 'days' | 'months' | 'years';

type TimeKey = 'hour' | 'minute' | 'second';

interface Day {
  key: number;
  date: Date;
  label: number;
  name: string;
  outside: boolean;
  today: boolean;
  selected: boolean;
  active: boolean;
  weekend: boolean;
  disabled: boolean;
}

interface Cell {
  value: number;
  label: string;
  selected: boolean;
  current: boolean;
  active: boolean;
  disabled: boolean;
}

interface Column {
  key: TimeKey;
  label: string;
  items: number[];
}

const pad = (value: number) => String(value).padStart(2, '0');

const dayKey = (date: Date) => date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const range = (count: number, step = 1) => Array.from({ length: Math.ceil(count / step) }, (_, index) => index * step);

function addMonths(date: Date, months: number): Date {
  const last = new Date(date.getFullYear(), date.getMonth() + months + 1, 0).getDate();

  return new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), last));
}

function parse(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(value);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const time = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (time) {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), +time[1], +time[2], +(time[3] ?? 0));
  }

  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);

  if (local) {
    return new Date(+local[1], +local[2] - 1, +local[3], +(local[4] ?? 0), +(local[5] ?? 0), +(local[6] ?? 0));
  }

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;
}

function serialize(date: Date, mode: DatepickerMode, seconds: boolean): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${seconds ? `:${pad(date.getSeconds())}` : ''}`;

  return mode === 'date' ? day : mode === 'time' ? time : `${day}T${time}`;
}

@Component({
  selector: 'app-datepicker',
  host: {
    '[attr.id]': 'null',
    '(document:pointerdown)': 'onOutside($event)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'onEscape($event)',
  },
  imports: [Validation],
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Datepicker), multi: true }],
})
export class Datepicker extends BaseComponent implements ControlValueAccessor {
  readonly id = input<string>('');

  readonly label = input<string>('');

  readonly mode = input<DatepickerMode>('date');

  readonly placeholder = input<string>('');

  readonly min = input<string | Date | null>(null);

  readonly max = input<string | Date | null>(null);

  readonly minuteStep = input<number>(1);

  readonly seconds = input<boolean>(false);

  readonly disabled = input<boolean>(false);

  protected readonly value = signal<Date | null>(null);

  protected readonly draft = signal<Date | null>(null);

  protected readonly cursor = signal<Date>(startOfDay(new Date()));

  protected readonly view = signal<DatepickerView>('days');

  protected readonly open = signal<boolean>(false);

  protected readonly placement = signal({ up: false, right: false });

  private readonly formDisabled = signal<boolean>(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasDate = computed(() => this.mode() !== 'time');

  protected readonly hasTime = computed(() => this.mode() !== 'date');

  protected readonly pad = pad;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly injector = inject(Injector);

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  private readonly locale = computed(() => this.flowService.get<string>('language') ?? environment.defaultLanguage);

  protected readonly labels = computed(() => ({
    date: this.getResource('DATEPICKER_DATE', 'Tarih seçin'),
    datetime: this.getResource('DATEPICKER_DATETIME', 'Tarih ve saat seçin'),
    time: this.getResource('DATEPICKER_TIME', 'Saat seçin'),
    today: this.getResource('DATEPICKER_TODAY', 'Bugün'),
    now: this.getResource('DATEPICKER_NOW', 'Şimdi'),
    clear: this.getResource('DATEPICKER_CLEAR', 'Temizle'),
    ok: this.getResource('DATEPICKER_OK', 'Tamam'),
    previous: this.getResource('DATEPICKER_PREVIOUS', 'Önceki'),
    next: this.getResource('DATEPICKER_NEXT', 'Sonraki'),
    hour: this.getResource('DATEPICKER_HOUR', 'Saat'),
    minute: this.getResource('DATEPICKER_MINUTE', 'Dakika'),
    second: this.getResource('DATEPICKER_SECOND', 'Saniye'),
  }));

  protected readonly placeholderText = computed(() => this.placeholder() || this.labels()[this.mode()]);

  private readonly bounds = computed(() => {
    const min = parse(this.min());
    const max = parse(this.max());

    return { min: min ? dayKey(min) : -Infinity, max: max ? dayKey(max) : Infinity };
  });

  protected readonly todayAllowed = computed(() => !this.hasDate() || this.inRange(new Date(), new Date()));

  protected readonly display = computed(() => {
    const value = this.value();

    if (!value) {
      return '';
    }

    const mode = this.mode();
    const date: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    return this.format(value, mode === 'date' ? date : mode === 'time' ? this.timeOptions() : { ...date, ...this.timeOptions() });
  });

  protected readonly summary = computed(() => {
    const draft = this.draft();

    return {
      weekday: draft ? this.format(draft, { weekday: 'long' }) : '',
      date: draft ? this.format(draft, { day: 'numeric', month: 'long', year: 'numeric' }) : this.placeholderText(),
      time: draft ? this.format(draft, this.timeOptions()) : this.seconds() ? '--:--:--' : '--:--',
    };
  });

  protected readonly weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) => this.format(new Date(2024, 0, 1 + index), { weekday: 'short' })),
  );

  protected readonly title = computed(() => {
    const cursor = this.cursor();
    const view = this.view();

    if (view === 'days') {
      return this.format(cursor, { month: 'long', year: 'numeric' });
    }

    if (view === 'months') {
      return String(cursor.getFullYear());
    }

    const start = Math.floor(cursor.getFullYear() / 12) * 12;

    return `${start} – ${start + 11}`;
  });

  protected readonly days = computed<Day[]>(() => {
    const cursor = this.cursor();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    const names = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' });
    const today = dayKey(new Date());
    const draft = this.draft();
    const selected = draft ? dayKey(draft) : -1;
    const active = dayKey(cursor);

    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(start, index);
      const key = dayKey(date);

      return {
        key,
        date,
        label: date.getDate(),
        name: names.format(date),
        outside: date.getMonth() !== cursor.getMonth(),
        today: key === today,
        selected: key === selected,
        active: key === active,
        weekend: date.getDay() % 6 === 0,
        disabled: !this.inRange(date, date),
      };
    });
  });

  protected readonly months = computed<Cell[]>(() => {
    const cursor = this.cursor();
    const year = cursor.getFullYear();
    const draft = this.draft();
    const now = new Date();

    return range(12).map((month) => ({
      value: month,
      label: this.format(new Date(year, month, 1), { month: 'long' }),
      selected: !!draft && draft.getFullYear() === year && draft.getMonth() === month,
      current: now.getFullYear() === year && now.getMonth() === month,
      active: cursor.getMonth() === month,
      disabled: !this.inRange(new Date(year, month, 1), new Date(year, month + 1, 0)),
    }));
  });

  protected readonly years = computed<Cell[]>(() => {
    const cursor = this.cursor();
    const start = Math.floor(cursor.getFullYear() / 12) * 12;
    const selected = this.draft()?.getFullYear();
    const current = new Date().getFullYear();

    return range(12).map((index) => {
      const year = start + index;

      return {
        value: year,
        label: String(year),
        selected: year === selected,
        current: year === current,
        active: year === cursor.getFullYear(),
        disabled: !this.inRange(new Date(year, 0, 1), new Date(year, 11, 31)),
      };
    });
  });

  protected readonly columns = computed<Column[]>(() => {
    const labels = this.labels();
    const columns: Column[] = [
      { key: 'hour', label: labels.hour, items: range(24) },
      { key: 'minute', label: labels.minute, items: range(60, Math.max(1, this.minuteStep())) },
    ];

    if (this.seconds()) {
      columns.push({ key: 'second', label: labels.second, items: range(60) });
    }

    return columns;
  });

  private notifyChange: (value: string) => void = () => {};

  private notifyTouched: () => void = () => {};

  protected toggle(): void {
    if (this.open()) {
      this.close(true);
      return;
    }

    this.show();
  }

  protected show(): void {
    if (this.isDisabled() || this.open()) {
      return;
    }

    const value = this.value();

    this.draft.set(value);
    this.cursor.set(startOfDay(value ?? new Date()));
    this.view.set('days');
    this.placement.set({ up: false, right: false });
    this.open.set(true);

    this.afterRender(() => {
      this.place();
      this.scrollTime();
      this.focusActive();
    });
  }

  protected close(restoreFocus: boolean): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.notifyTouched();

    if (restoreFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  protected shift(direction: number): void {
    const months = { days: 1, months: 12, years: 144 }[this.view()];

    this.cursor.update((cursor) => addMonths(cursor, direction * months));
  }

  protected zoomOut(): void {
    this.zoom(this.view() === 'days' ? 'months' : 'years');
  }

  protected selectDay(day: Day): void {
    const draft = this.draft();
    const date = new Date(day.date);

    if (draft && this.hasTime()) {
      date.setHours(draft.getHours(), draft.getMinutes(), draft.getSeconds());
    }

    this.cursor.set(day.date);

    if (this.mode() === 'date') {
      this.commit(date);
      return;
    }

    this.draft.set(date);
  }

  protected selectMonth(month: number): void {
    const cursor = this.cursor();

    this.cursor.set(addMonths(cursor, month - cursor.getMonth()));
    this.zoom('days');
  }

  protected selectYear(year: number): void {
    const cursor = this.cursor();

    this.cursor.set(addMonths(cursor, (year - cursor.getFullYear()) * 12));
    this.zoom('months');
  }

  protected part(key: TimeKey): number {
    const draft = this.draft();

    if (!draft) {
      return -1;
    }

    return key === 'hour' ? draft.getHours() : key === 'minute' ? draft.getMinutes() : draft.getSeconds();
  }

  protected setTime(key: TimeKey, value: number): void {
    const date = new Date(this.draft() ?? this.cursor());

    if (key === 'hour') {
      date.setHours(value);
    } else if (key === 'minute') {
      date.setMinutes(value);
    } else {
      date.setSeconds(value);
    }

    this.draft.set(date);
  }

  protected pickNow(): void {
    const now = new Date();
    const step = Math.max(1, this.minuteStep());

    now.setMinutes(Math.floor(now.getMinutes() / step) * step, this.seconds() ? now.getSeconds() : 0, 0);
    this.commit(this.hasTime() ? now : startOfDay(now));
  }

  protected confirm(): void {
    const draft = this.draft();

    if (draft) {
      this.commit(draft);
    }
  }

  protected clear(): void {
    this.commit(null);
  }

  protected onDaysKeydown(event: KeyboardEvent): void {
    const cursor = this.cursor();
    const weekday = (cursor.getDay() + 6) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(cursor, -1),
      ArrowRight: () => addDays(cursor, 1),
      ArrowUp: () => addDays(cursor, -7),
      ArrowDown: () => addDays(cursor, 7),
      Home: () => addDays(cursor, -weekday),
      End: () => addDays(cursor, 6 - weekday),
      PageUp: () => addMonths(cursor, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(cursor, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];

    if (!move) {
      return;
    }

    event.preventDefault();
    this.cursor.set(move());
    this.afterRender(() => this.focusActive());
  }

  protected onColumnKeydown(event: KeyboardEvent, key: TimeKey, items: number[]): void {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;

    if (!step) {
      return;
    }

    event.preventDefault();

    const index = items.indexOf(this.part(key));
    const list = event.currentTarget as HTMLElement;

    this.setTime(key, items[index < 0 ? 0 : (index + step + items.length) % items.length]);
    this.afterRender(() => {
      const item = list.querySelector<HTMLElement>('.is-selected');

      item?.focus();
      item?.scrollIntoView({ block: 'nearest' });
    });
  }

  onOutside(event: Event): void {
    if (this.open() && !this.element.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  onFocusOut(event: Event): void {
    const next = (event as FocusEvent).relatedTarget as Node | null;

    if (this.open() && next && !this.element.nativeElement.contains(next)) {
      this.close(false);
    }
  }

  onEscape(event: Event): void {
    if (!this.open()) {
      return;
    }

    event.stopPropagation();
    this.close(true);
  }

  writeValue(value: unknown): void {
    this.value.set(parse(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.notifyChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  private commit(date: Date | null): void {
    this.value.set(date);
    this.notifyChange(date ? serialize(date, this.mode(), this.seconds()) : '');
    this.open.set(false);
    this.notifyTouched();
    this.trigger().nativeElement.focus();
  }

  private zoom(view: DatepickerView): void {
    this.view.set(view);
    this.afterRender(() => this.focusActive());
  }

  private inRange(from: Date, to: Date): boolean {
    const { min, max } = this.bounds();

    return dayKey(to) >= min && dayKey(from) <= max;
  }

  private format(date: Date, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale(), options).format(date);
  }

  private timeOptions(): Intl.DateTimeFormatOptions {
    return { hour: '2-digit', minute: '2-digit', second: this.seconds() ? '2-digit' : undefined, hourCycle: 'h23' };
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }

  private place(): void {
    const host = this.element.nativeElement;
    const control = host.querySelector<HTMLElement>('.datepicker__control');
    const panel = host.querySelector<HTMLElement>('.datepicker__panel');

    if (!control || !panel) {
      return;
    }

    const field = control.getBoundingClientRect();

    this.placement.set({
      up: field.bottom + panel.offsetHeight + 8 > window.innerHeight && field.top - panel.offsetHeight - 8 > 0,
      right: field.left + panel.offsetWidth > window.innerWidth - 8 && field.right - panel.offsetWidth > 8,
    });
  }

  private scrollTime(): void {
    this.element.nativeElement.querySelectorAll<HTMLElement>('.datepicker__list').forEach((list) => {
      const item = list.querySelector<HTMLElement>('.is-selected');

      if (item) {
        list.scrollTop = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
      }
    });
  }

  private focusActive(): void {
    const panel = this.element.nativeElement.querySelector('.datepicker__panel');

    (
      panel?.querySelector<HTMLElement>('[data-focus]') ??
      panel?.querySelector<HTMLElement>('.datepicker__list .is-selected') ??
      panel?.querySelector<HTMLElement>('.datepicker__list button')
    )?.focus();
  }
}
