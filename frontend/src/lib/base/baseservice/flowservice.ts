import { Injectable, Injector, computed, effect, inject, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ActivationStart,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
} from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import {
  FlowButton,
  FlowConfig,
  FlowStep,
  ServiceConfig,
  ValidationError,
  ValidationRuleConfig,
} from '../baseconfig/config';
import { FeatureCode } from '../baseconfig/features';
import { ModuleConfig } from '../baseconfig/moduleconfig';
import { BaseService } from './baseservice';
import { FeatureFlagService } from './featureflagservice';
import { Validationservice } from './validationservice';

/**
 * Ekran akışının merkezi.
 *
 * Route verisindeki FlowConfig'i okur ve şu soruları yanıtlar: hangi adımdayız,
 * hangi butonlar görünür, hangi doğrulamalar geçerli. Ayrıca oturum token'ını
 * ve devam eden istek sayacını tutar.
 *
 * Ekranlar bu servise BaseComponent üzerinden bağlanır; böylece adım mantığı
 * bileşenlere dağılmak yerine tek yerde toplanır.
 */
@Injectable({
  providedIn: 'root',
})
export class FlowService extends BaseService {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly validationService = inject(Validationservice);
  private readonly featureFlagService = inject(FeatureFlagService);

  /** Route olaylarına abone olur ve token'ı saklamak için effect kurar. */
  constructor() {
    super();

    // ActivationStart, bileşen oluşturulmadan önce tetiklendiği için adım
    // yapılandırması ekran çizilmeye başlamadan hazır olur.
    this.router.events.subscribe((event) => {
      if (event instanceof ActivationStart) {
        this.readRoute(event.snapshot);
      }
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
      }
      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.keepStateOnce = false;
      }
    });

    // Token her değiştiğinde saklanır; giriş ve çıkış ayrıca yazma çağırmaz.
    effect(() => this.writeToken(this.token()));
  }


  /** Oturum token'ı. Değiştiğinde yukarıdaki effect ile localStorage'a yazılır. */
  public readonly token = signal<string | undefined>(this.readToken());

  /**
   * Saklanan token'ı okur.
   *
   * Sunucu tarafı render'ında ve gizli sekmede localStorage erişilemeyebilir;
   * bu durumda hata fırlatmak yerine oturum yokmuş gibi davranılır.
   */
  private readToken(): string | undefined {
    try {
      return localStorage.getItem('bankatek-token') ?? undefined;
    } catch {
      return undefined;
    }
  }

  /** Token'ı saklar, boşsa siler. Depolama kapalıysa sessizce geçilir. */
  private writeToken(value: string | undefined): void {
    try {
      value ? localStorage.setItem('bankatek-token', value) : localStorage.removeItem('bankatek-token');
    } catch {
      return;
    }
  }

  /** Açık olan adres. Menüde aktif ekranı işaretlemek için kullanılır. */
  public readonly url = signal<string>('');

  /** Elde token varsa oturum açık sayılır. */
  public readonly isLoggedIn = computed<boolean>(() => !!this.token());

  /** Devam eden HTTP isteği sayısı; interceptor artırıp azaltır. */
  public readonly pendingRequests = signal(0);

  /** Global yükleniyor göstergesi bunu okur. */
  public readonly loading = computed<boolean>(() => this.pendingRequests() > 0);

  /** Son servis hatası; interceptor yazar. Yeni istekte temizlenir. */
  public readonly serviceError = this.select<string>('serviceError');

  /** İçinde bulunulan transaction, örneğin 'accounts/accountlist'. */
  public readonly transaction = signal<string>('');

  /** İçinde bulunulan adım; route'un son parçası. */
  public readonly currentStep = signal<string>('');

  /** Route verisinden okunan yapılandırma. */
  public readonly config = signal<FlowConfig | undefined>(undefined);

  /**
   * İçinde bulunulan modülün yapılandırması.
   *
   * Menü içeriğini bu belirler: transfers altındaki bir ekran ile customers
   * altındaki bir ekran farklı gruplar görür.
   */
  public readonly moduleConfig = signal<ModuleConfig | undefined>(undefined);

  /** Yapılandırmadaki bütün adımlar. */
  public readonly steps = computed<FlowStep[]>(() =>
    (this.config()?.config.steps ?? []).filter((step) => this.isFeatureOn(step.isEnable)),
  );

  /** Geçerli adımın yapılandırması. */
  public readonly currentStepConfig = computed<FlowStep | undefined>(() =>
    this.steps().find((step) => step.step === this.currentStep()),
  );

  /** Geçerli adımın sıradaki yeri; ileri/geri gitmek için gerekli. */
  public readonly stepIndex = computed<number>(() => this.steps().findIndex((step) => step.step === this.currentStep()));

  /** İleri butonu yalnızca açıkça istendiğinde görünür. */
  public readonly showContinueButton = computed<boolean>(() => this.currentStepConfig()?.showContinueButton === true);

  /** Geri butonu yalnızca açıkça istendiğinde görünür. */
  public readonly showBackButton = computed<boolean>(() => this.currentStepConfig()?.showBackButton === true);

  /** Adıma tanımlanmış yapılandırma butonları. */
  public readonly buttons = computed<FlowButton[]>(() => this.currentStepConfig()?.buttons ?? []);

  /** Çerçevesiz ekranlar (giriş gibi) için true. */
  public readonly disableLayout = computed<boolean>(() => this.currentStepConfig()?.disableLayout === true);

  /** Header ve footer varsayılan olarak görünür; yalnızca açıkça false verilirse gizlenir. */
  public readonly showHeader = computed<boolean>(() => this.currentStepConfig()?.showHeader !== false);

  public readonly showFooter = computed<boolean>(() => this.currentStepConfig()?.showFooter !== false);

  /** Menü de varsayılan olarak görünür; yalnızca açıkça false verilirse gizlenir. */
  public readonly showMenu = computed<boolean>(() => this.currentStepConfig()?.showMenu !== false);

  /** Kullanıcı "devam"a basana kadar hata gösterilmez; form açılır açılmaz kızarmaz. */
  private readonly validated = signal(false);

  /** Geçerli adımın hataları. Doğrulama henüz tetiklenmediyse boş döner. */
  public readonly errors = computed<ValidationError[]>(() => {
    const step = this.currentStepConfig();
    if (!this.validated() || !step) {
      return [];
    }

    const rules = step.validation.filter((rule) => this.isFeatureOn(rule.isEnable));
    const errors = this.validationService.validate(rules, (rule) => this.ruleValue(rule));

    return errors.map((error) => ({ id: error.id, message: this.ruleMessage(error.message) }));
  });

  /** Yapılandırmadaki isEnable alanının karşılığı. Boş bırakılmışsa koşul yok demektir. */
  private isFeatureOn(code: FeatureCode | undefined): boolean {
    return !code || this.featureFlagService.isEnableFeature(code);
  }

  /** Doğrulamayı açar ve geçerli adımın geçip geçmediğini döndürür. */
  public validateCurrentStep(): Promise<boolean> {
    this.validated.set(true);

    return Promise.resolve(this.errors().length === 0);
  }

  /** Tek bir alanın hata mesajı; hata yoksa boş metin. */
  public getError(id: string): string {
    return this.errors().find((error) => error.id === id)?.message ?? '';
  }

  /**
   * Kuralın denetleyeceği değeri bulur. Yapılandırmada value boş bırakılmışsa
   * alan id'si State yolu kabul edilir; çoğu kuralda ikisi zaten aynı.
   */
  private ruleValue(rule: ValidationRuleConfig): any {
    const path = typeof rule.value === 'string' && rule.value.trim() !== '' ? rule.value.trim() : rule.id;
    return this.getStateValue(path);
  }

  /**
   * Hata mesajını çözer. 'ANAHTAR|varsayılan metin' biçimi kaynaktan çeviri
   * almayı sağlar; ayraç yoksa metin olduğu gibi gösterilir.
   */
  private ruleMessage(message: string): string {
    const index = message.indexOf('|');
    if (index < 0) {
      return message;
    }

    return this.getResource(message.slice(0, index).trim(), message.slice(index + 1).trim());
  }

  /** Doğrulama geçerse sonraki adıma geçer. Son adımdaysak hiçbir şey olmaz. */
  public async next(): Promise<void> {
    const isValid = await this.validateCurrentStep();
    if (!isValid) {
      return;
    }

    // Son adımdaysak dizi sınırının dışına çıkılır ve undefined döner.
    const nextStep = this.steps()[this.stepIndex() + 1];
    if (nextStep) {
      await this.goTo(nextStep.step);
    }
  }

  /** Önceki adıma döner. Geri giderken doğrulama aranmaz. */
  public async back(): Promise<void> {
    const previousStep = this.steps()[this.stepIndex() - 1];
    if (previousStep) {
      await this.goTo(previousStep.step);
    }
  }

  /**
   * Aynı transaction içinde adım değiştirir. Adres yapısı
   * '<modül>/<transaction>/<adım>' olduğu için son parçayı değiştirmek yeterli.
   */
  public goTo(step: string): Promise<boolean> {
    // Sorgu parametreleri adım adından önce ayrılıyor, yoksa son parçaya karışır.
    const segments = this.router.url.split('?')[0].split('/');
    segments[segments.length - 1] = step;

    return this.router.navigateByUrl(segments.join('/'));
  }


  /**
   * Buton görünürlüğü.
   *
   * isVisible üç biçimde verilebilir: hiç verilmemiş ya da boolean, State
   * içindeki bir yolu gösteren metin, veya durumu okuyabilen bir fonksiyon.
   * Verilmediğinde buton görünür kabul edilir.
   */
  public isButtonVisible(button: FlowButton): boolean {
    // Bayrak kapalıysa isVisible'a hiç bakılmaz.
    if (!this.isFeatureOn(button.isEnable)) {
      return false;
    }

    const isVisible = button.isVisible;

    if (isVisible === undefined || typeof isVisible === 'boolean') {
      return isVisible !== false;
    }
    if (typeof isVisible === 'function') {
      return isVisible({ get: <T>(key: string) => this.getStateValue<T>(key) });
    }

    return this.getStateValue<boolean>(isVisible) === true;
  }

  /** Yapılandırma butonunun tıklanması; hedef tanımlıysa oraya gider. */
  public clickButton(button: FlowButton): void {
    if (button.navigate) {
      this.router.navigateByUrl(button.navigate);
    }
  }

  private keepStateOnce = false;

  public navigate(target: string, keepState = false): Promise<boolean> {
    this.keepStateOnce = keepState;

    return this.router.navigateByUrl(this.resolvePath(target));
  }

  private resolvePath(target: string): string {
    const parts = target.split('/').filter((part) => part !== '');

    if (parts.length === 1) {
      const found = this.menu()
        .flatMap((module) => module.children ?? [])
        .find((item) => (item.path ?? '').split('/').filter((part) => part !== '')[1] === parts[0]);

      if (found?.path) {
        return found.path.startsWith('/') ? found.path : `/${found.path}`;
      }
    }

    return `/${(parts.length < 3 ? [...parts, 'start'] : parts).join('/')}`;
  }

  /**
   * Adım yapılandırmasındaki servisi çağırır.
   *
   * Metin olarak verilen parametreler State yolu kabul edilip çözülür; sonuç
   * '<adım>Response' anahtarıyla State'e yazılır. Servis promise de observable
   * da döndürebildiği için ikisi de destekleniyor.
   */
  private async callService(step: string, config: ServiceConfig): Promise<void> {
    // Servis sınıfı yapılandırmada tip olarak durur, örneği injector'dan alınır.
    const service = this.injector.get<any>(config.serviceName);
    const params = config.params.map((param) => (typeof param === 'string' ? this.getStateValue(param) : param));
    const result = service[config.methodName](...params);

    this.set(`${step}Response`, isObservable(result) ? await firstValueFrom(result) : await result);
  }

  /**
   * Her route aktivasyonunda çalışır: yapılandırmayı ve geçerli adımı kurar,
   * ekran metinlerini yükler, gerekiyorsa adımın servisini çağırır.
   *
   * Başka bir transaction'a geçildiğinde State temizlenir; yoksa önceki
   * ekranın Request ve liste verileri yeni ekrana sızar. Bilerek taşımak
   * gerekiyorsa adım yapılandırmasındaki keepState bunu kapatır.
   */
  /**
   * Modül yapılandırmasını route ağacında yukarı doğru arar.
   *
   * Yapılandırma <modül>.routes.ts içinde transaction route'una konur, yani
   * adımın kendisinde değil atasında durur. Burada Angular'ın veri devralma
   * kuralına güvenmek yerine route tanımlarının kendi data alanı okunuyor;
   * devralma stratejisi değişse de menü doğru modülü bulur.
   */
  private readModuleConfig(snapshot: ActivatedRouteSnapshot): ModuleConfig | undefined {
    for (let current: ActivatedRouteSnapshot | null = snapshot; current; current = current.parent) {
      const moduleConfig = current.routeConfig?.data?.['moduleConfig'] as ModuleConfig | undefined;
      if (moduleConfig) {
        return moduleConfig;
      }
    }

    return undefined;
  }

  private readRoute(snapshot: ActivatedRouteSnapshot): void {
    const config = snapshot.data['config'] as FlowConfig | undefined;
    const step = snapshot.routeConfig?.path ?? '';

    if (!config || !step) {
      return;
    }

    const stepConfig = config.config.steps.find((item) => item.step === step);
    // Transaction adı üst route'un parçalarından kurulur: 'accounts/accountlist'.
    const transaction = snapshot.parent?.url.map((segment) => segment.path).join('/') ?? '';
    const previous = this.transaction();

    // Yalnızca ilk adımda temizlenir; aynı akışın adımları arasında gezinirken
    // veri korunmalı.
    if (
      step === 'start' &&
      previous !== '' &&
      previous !== transaction &&
      stepConfig?.keepState !== true &&
      !this.keepStateOnce
    ) {
      this.clear();
    }

    this.keepStateOnce = false;

    this.config.set(config);
    this.moduleConfig.set(this.readModuleConfig(snapshot));
    this.transaction.set(transaction);
    this.currentStep.set(step);

    // Yeni adımda hatalar sıfırdan başlar.
    this.validated.set(false);

    // Önce ortak metinler, sonra ekrana özel olanlar.
    this.loadResources('general');
    this.loadResources(transaction);

    if (stepConfig?.service) {
      this.callService(step, stepConfig.service).catch((error) => console.error(error));
    }
  }
}
