import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MenuControllerService } from '@lib/services/api/menuController.service';
import { ResourceControllerService } from '@lib/services/api/resourceController.service';
import { MenuItemModel } from '@lib/services/model/menuItemModel';

/** Sarmalayıcı proxy'den içindeki asıl nesneye ulaşmak için kullanılan anahtar. */
const RAW = Symbol('raw');

/**
 * Bütün servislerin ortak temeli. Dört işi var:
 *
 * 1. Paylaşılan durum (State): anahtar/değer deposu, sinyal üzerinden reaktif
 * 2. Kaynaklar: ekran metinlerinin sunucudan gelen karşılıkları
 * 3. İstek tekilliği (once/forget): aynı veriyi iki kez çekmeyi engeller
 * 4. Menü: bir kez yüklenip paylaşılan menü ağacı
 *
 * Soyuttur; FlowService ve ThemeService gibi somut servisler bunu genişletir.
 * Her somut servis kendi örneğini aldığı için State'leri de ayrıdır. Ekranlar
 * BaseComponent üzerinden FlowService'inkine bağlanır, dolayısıyla pratikte
 * tek bir ortak durum kullanılır.
 */
@Injectable({
  providedIn: 'root',
})
export abstract class BaseService {
  private readonly resourceControllerService = inject(ResourceControllerService);

  private readonly menuControllerService = inject(MenuControllerService);

  /** Asıl depo. Map'in kendisi reaktif değildir, sürüm sinyali onu reaktif yapar. */
  private readonly state = new Map<string, any>();

  /**
   * Durum sürümü. Her yazmada bir artar.
   *
   * get() bu sinyali okuduğu için State'e erişen her computed ve şablon,
   * durum değiştiğinde kendiliğinden yeniden hesaplanır. Tek tek anahtarlar
   * için ayrı sinyal tutmaya gerek kalmaz.
   */
  private readonly stateVersion = signal(0);

  /**
   * Duruma nesne gibi erişim sağlayan proxy.
   *
   * `State.Request = {...}` yazmak set('Request', ...), `State.Request` okumak
   * get('Request') çağırır. Böylece bileşenler ayrı sinyal tanımlamadan
   * paylaşılan ve reaktif bir durum kullanabiliyor.
   */
  public readonly State: any = new Proxy(
    {},
    {
      get: (target, key: string) => this.get(key),
      set: (target, key: string, value: any) => {
        this.set(key, value);
        return true;
      },
    },
  );

  /** Durum yazar ve dinleyenleri tetikler. */
  public set(key: string, value: any): void {
    this.state.set(key, this.raw(value));
    this.stateVersion.update((version) => version + 1);
  }

  /** Durum okur. Sürüm sinyalini okuduğu için çağrıldığı yer reaktif olur. */
  public get<T>(key: string): T | undefined {
    this.stateVersion();
    return this.reactive(this.state.get(key)) as T;
  }

  /** Sarılmış nesneler; aynı nesne için her seferinde aynı proxy dönsün diye. */
  private readonly proxies = new WeakMap<object, any>();

  /**
   * Nesneyi, içindekilerle birlikte reaktif bir proxy'ye sarar.
   *
   * En üstteki State proxy'si yalnızca `State.Request = {...}` biçimindeki
   * yazmaları görür. İki yönlü bağlama ise `State.Request.cityId = $event`
   * üretir; bu yazma iç nesneye gittiği için sürüm sinyali artmaz ve hiçbir
   * şablon yenilenmezdi. Burada iç nesneler de sarılarak derindeki yazmalar
   * da duyuruluyor.
   *
   * Yalnızca düz nesneler ve diziler sarılır. Date gibi yerleşik tipler veri
   * değil davranış taşır; sarıldıklarında iç metotları bozulur.
   */
  private reactive<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      return value;
    }

    // Zaten sarılmış bir nesne geldiyse asıl hedef üzerinden devam edilir;
    // yoksa proxy'nin proxy'si oluşur ve her katman sürümü ayrıca artırır.
    const target: any = (value as any)[RAW] ?? value;
    const cached = this.proxies.get(target);
    if (cached) {
      return cached;
    }

    const proxy = new Proxy(target, {
      get: (item, key) => {
        if (key === RAW) {
          return item;
        }

        this.stateVersion();
        return this.reactive(item[key]);
      },
      set: (item, key, next) => {
        const value = this.raw(next);

        // Aynı değeri tekrar yazmak sürüm artırmaz. ngModel her tuş vuruşunda
        // yazdığı için bu kontrol olmadan gereksiz yeniden çizim olurdu.
        if (item[key] === value) {
          return true;
        }

        item[key] = value;
        this.stateVersion.update((version) => version + 1);

        return true;
      },
      deleteProperty: (item, key) => {
        delete item[key];
        this.stateVersion.update((version) => version + 1);

        return true;
      },
    });

    this.proxies.set(target, proxy);

    return proxy;
  }

  /** Proxy ise sardığı asıl nesneyi, değilse değerin kendisini döndürür. */
  private raw<T>(value: T): T {
    return value !== null && typeof value === 'object' ? ((value as any)[RAW] ?? value) : value;
  }

  /** Tek bir anahtarı sinyal olarak döndürür. */
  public select<T>(key: string): Signal<T | undefined> {
    return computed(() => this.get<T>(key));
  }

  /** Durumun tamamını siler. Başka bir transaction'a geçildiğinde çağrılır. */
  public clear(): void {
    this.state.clear();
    this.stateVersion.update((version) => version + 1);
  }

  /**
   * Noktalı yol ile iç içe değer okur: 'State.Request.cityId' verilince
   * Request nesnesinin cityId alanını döndürür.
   *
   * Yapılandırmadaki doğrulama kuralları ve buton görünürlükleri alanı bu
   * biçimde metin olarak tanımladığı için gerekli.
   */
  public getStateValue<T>(path: string): T | undefined {
    // 'State' öneki yazılsa da yazılmasa da çalışsın diye ayıklanıyor.
    // Zincirde eksik bir halka varsa ?. sayesinde hata yerine undefined döner.
    return path
      .split('.')
      .filter((key) => key !== 'State')
      .reduce<any>((value, key) => value?.[key], this.State);
  }

  /** Sunucudan yüklenen metinler: anahtar -> karşılık. */
  private readonly resources = signal<Record<string, string>>({});

  /** Hangi grupların yüklendiği; aynı grubu iki kez istememek için. */
  private readonly loadedResources = new Set<string>();

  /**
   * Ekran metnini döndürür.
   *
   * Kaynak henüz gelmediyse ya da anahtarın karşılığı yoksa verilen varsayılan
   * kullanılır. Bu sayede ekran hiçbir zaman boş görünmez; kaynak sonradan
   * yüklendiğinde metin kendiliğinden güncellenir.
   */
  public getResource(key: string, value: string): string {
    return this.resources()[key] ?? value;
  }

  /** Bir kaynak grubunu (transaction adı) bir kez yükler. */
  public loadResources(group: string): void {
    if (!group || this.loadedResources.has(group)) {
      return;
    }
    // İstek başlamadan işaretlenir; aynı anda gelen ikinci çağrı da elenir.
    this.loadedResources.add(group);

    firstValueFrom(this.resourceControllerService.get({ transactionName: group }))
      .then((response) => {
        // Gelen liste anahtar/değer nesnesine çevrilip mevcutların üzerine eklenir;
        // böylece 'general' grubu ile ekrana özel grup birlikte yaşayabilir.
        const loaded: Record<string, string> = {};
        response?.resources?.forEach((item) => (loaded[item.key ?? ''] = item.value ?? ''));
        this.resources.update((current) => ({ ...current, ...loaded }));
      })
      .catch((error) => console.error(`Resource load failed: ${group}`, error));
  }

  /** Devam eden veya tamamlanmış istekler; anahtar -> promise. */
  private readonly requests = new Map<string, Promise<any>>();

  /**
   * Aynı anahtarlı isteği yalnızca bir kez çalıştırır; sonraki çağrılar aynı
   * promise'i alır. Şehir ve şube listesi gibi ekrandan ekrana tekrar eden
   * veriler için kullanılır.
   *
   * Hata alan istek önbellekten düşürülür, yoksa geçici bir ağ hatası bütün
   * oturum boyunca o veriyi erişilemez bırakırdı.
   */
  public once<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (!this.requests.has(key)) {
      this.requests.set(
        key,
        load().catch((error) => {
          this.requests.delete(key);
          throw error;
        }),
      );
    }

    return this.requests.get(key) as Promise<T>;
  }

  /** Verilen önekle başlayan önbellek kayıtlarını düşürüp yeniden yüklemeye zorlar. */
  public forget(prefix: string): void {
    for (const key of Array.from(this.requests.keys())) {
      if (key.startsWith(prefix)) {
        this.requests.delete(key);
      }
    }
  }

  private readonly menuItems = signal<MenuItemModel[]>([]);

  /** Menü bir kez yüklenir; bu bayrak tekrar istek atılmasını engeller. */
  private menuLoaded = false;

  /** Menü ağacı; yalnızca okunabilir. */
  public readonly menu = this.menuItems.asReadonly();

  /** Menüyü bir kez yükler. Sonraki çağrılar hiçbir şey yapmaz. */
  public loadMenu(): void {
    if (this.menuLoaded) {
      return;
    }
    this.menuLoaded = true;

    firstValueFrom(this.menuControllerService.menuList({}))
      .then((response) => this.menuItems.set(response?.items ?? []))
      .catch((error) => console.error('Menu load failed:', error));
  }
}
