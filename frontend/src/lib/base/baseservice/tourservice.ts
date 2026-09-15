import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { TourStepConfig } from '../baseconfig/config';
import { FlowService } from './flowservice';

/** Işık tutulan alanın görünüm alanındaki yeri. */
export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Görülen turların saklandığı anahtar; 'bankatek-token' ile aynı aile. */
const STORAGE_KEY = 'bankatek-tour';

/** "Bu ipuçlarını gizle" seçilince yazılan, bütün turları kapatan kayıt. */
const ALL = '*';

/** Işığın hedefin kenarından taşma payı. */
const PADDING = 8;

/** Hedef bu süre içinde belirmezse durak atlanır. */
const WAIT = 8000;

/** Hedef her karede ölçülüyor; yeri değişmedikçe sinyale yazılmasın. */
function same(a: TourRect | undefined, b: TourRect | undefined): boolean {
  return a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);
}

/**
 * Tanıtım turunun sürücüsü: yapılandırmadaki durakları sırayla gezer, hedefi
 * id ile bulup yerini yayınlar. Çizim işi Tour bileşenine ait.
 *
 * Sunucuda hiçbir şey yapmaz; tur ancak Tour bileşeni afterNextRender içinde
 * enable() çağırınca başladığı için ilk çizim sunucudan gelen HTML ile aynı olur.
 */
@Injectable({
  providedIn: 'root',
})
export class TourService {
  private readonly document = inject(DOCUMENT);

  private readonly flowService = inject(FlowService);

  private readonly current = signal<number>(-1);

  private readonly measured = signal<TourRect | undefined>(undefined, { equal: same });

  private readonly steps = computed<TourStepConfig[]>(() => this.flowService.currentStepConfig()?.tour ?? []);

  /** Turun kimliği: '<transaction>|<adım>'. */
  private readonly key = computed<string>(
    () => `${this.flowService.transaction()}|${this.flowService.currentStep()}`,
  );

  public readonly index = this.current.asReadonly();

  public readonly rect = this.measured.asReadonly();

  public readonly step = computed<TourStepConfig | undefined>(() => this.steps()[this.current()]);

  public readonly total = computed<number>(() => this.steps().length);

  public readonly active = computed<boolean>(() => this.step() !== undefined);

  public readonly isLast = computed<boolean>(() => this.current() === this.total() - 1);

  /** Tour bileşeni açana kadar hiçbir şey başlamaz. */
  private started = false;

  /** Kurulmuş turun anahtarı; aynı ekran iki kez kurulmasın. */
  private opened = '';

  private frame = 0;

  private deadline = 0;

  /** Ekran değiştikçe turu yeniden kurar. */
  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    effect(() => {
      this.key();
      this.steps();

      untracked(() => this.open());
    });
  }

  /** Turu açar; Tour bileşeni afterNextRender içinde çağırır. */
  public enable(): void {
    this.started = true;
    this.open();
  }

  /** Sıradaki durak; son duraktaysa turu bitirir. */
  public next(): void {
    this.isLast() ? this.finish() : this.show(this.current() + 1);
  }

  public back(): void {
    if (this.current() > 0) {
      this.show(this.current() - 1);
    }
  }

  /** Turu kapatır ve bu ekran için görüldü sayar. */
  public finish(): void {
    this.save(this.key());
    this.stop();
  }

  /** "Bu ipuçlarını gizle": bütün ekranlarda tur bir daha açılmaz. */
  public dismissAll(): void {
    this.save(ALL);
    this.stop();
  }

  /** İpuçlarını yeniden açar ve bu ekranın turunu baştan gösterir. */
  public reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Depolama kapalıysa zaten kayıt yok.
    }

    this.opened = '';
    this.open();
  }

  /** 'ANAHTAR|varsayılan metin' biçimini çözer; kaynaklar FlowService'te durur. */
  public label(text: string): string {
    const at = text.indexOf('|');

    return at < 0 ? text : this.flowService.getResource(text.slice(0, at).trim(), text.slice(at + 1).trim());
  }

  /** Ekran değişti: tur görülmemişse baştan kurulur. */
  private open(): void {
    const key = this.key();
    if (!this.started || key === this.opened) {
      return;
    }

    this.opened = key;
    this.stop();

    const seen = this.seen();
    if (this.steps().length > 0 && !seen.includes(ALL) && !seen.includes(key)) {
      this.show(0);
    }
  }

  private show(index: number): void {
    this.stop();
    this.current.set(index);
    this.deadline = Date.now() + WAIT;
    this.loop();
  }

  private stop(): void {
    this.document.defaultView?.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.current.set(-1);
    this.measured.set(undefined);
  }

  /**
   * Hedefi her karede yeniden ölçer: çoğu hedef veri geldikten sonra çiziliyor
   * ve sayfa kaydırılınca yer değiştiriyor, tek döngü ikisini de karşılıyor.
   * Hedef hiç gelmezse durak atlanır, yoksa tur karanlık ekranda kilitlenirdi.
   */
  private loop(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    this.frame = view.requestAnimationFrame(() => this.loop());

    const target = this.find();
    if (!target) {
      if (Date.now() > this.deadline) {
        this.next();
      }
      return;
    }

    // Hedef ilk bulunduğunda ekranın dışında kalmış olabilir.
    if (!this.measured()) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    const box = target.getBoundingClientRect();

    this.measured.set({
      top: Math.round(box.top - PADDING),
      left: Math.round(box.left - PADDING),
      width: Math.round(box.width + PADDING * 2),
      height: Math.round(box.height + PADDING * 2),
    });
  }

  /**
   * Durağın hedefi. app-input ve app-select id'yi içerideki alana verdiği için
   * ışık etiketi de içine alsın diye sarmalayıcıya çıkılıyor; henüz çizilmemiş
   * eleman sıfır yükseklikte durduğundan yok sayılır.
   */
  private find(): HTMLElement | null {
    const step = this.step();
    const found = step ? this.document.getElementById(step.id) : null;
    const element = found?.closest<HTMLElement>('app-input, app-select') ?? found;

    return element && element.getBoundingClientRect().height > 0 ? element : null;
  }

  /** Görülen turlar. Backend değişmediği için "ilk giriş"in tek kanıtı bu kayıt. */
  private seen(): string[] {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private save(key: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...this.seen(), key])]));
    } catch {
      return;
    }
  }
}
