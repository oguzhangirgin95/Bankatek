import { Directive, inject } from '@angular/core';
import { FlowButton } from '../baseconfig/config';
import { FeatureCode } from '../baseconfig/features';
import { CryptologyService } from '../baseservice/cryptologyservice';
import { FeatureFlagService } from '../baseservice/featureflagservice';
import { FlowService } from '../baseservice/flowservice';
import { ThemeService } from '../baseservice/themeservice';

/**
 * Bütün ekran bileşenlerinin temeli.
 *
 * FlowService, CryptologyService ve ThemeService'i bir kez enjekte edip sık
 * kullanılan üyelerini doğrudan sunar. Böylece her bileşende aynı enjeksiyonlar
 * tekrarlanmıyor ve şablonlarda `flowService.loading()` yerine `loading()`
 * yazılabiliyor.
 *
 * Buradaki üyelerin çoğu FlowService'e yönlendirmedir; iş mantığı orada durur,
 * bu sınıf yalnızca kısayol transferi görür.
 */
@Directive()
export abstract class BaseComponent {
  protected readonly flowService = inject(FlowService);

  protected readonly cryptologyService = inject(CryptologyService);

  protected readonly themeService = inject(ThemeService);

  protected readonly featureFlagService = inject(FeatureFlagService);

  /** Ekranlar arasında paylaşılan durum. Hem okuma hem yazma reaktiftir. */
  public readonly State = this.flowService.State;

  /** İçinde bulunulan adımın adı (route'un son parçası). */
  public readonly currentStep = this.flowService.currentStep;

  /** Adım yapılandırmasından gelen ileri/geri butonlarının görünürlüğü. */
  public readonly showContinueButton = this.flowService.showContinueButton;
  public readonly showBackButton = this.flowService.showBackButton;

  /** Adıma tanımlanmış yapılandırma butonları. */
  public readonly buttons = this.flowService.buttons;

  /** True ise header/footer/menü gibi çerçeve gizlenir; giriş ekranı bunu kullanır. */
  public readonly disableLayout = this.flowService.disableLayout;

  public readonly showHeader = this.flowService.showHeader;

  public readonly showFooter = this.flowService.showFooter;

  public readonly showMenu = this.flowService.showMenu;

  /** Devam eden bir HTTP isteği var mı. Global yükleniyor göstergesi bunu okur. */
  public readonly loading = this.flowService.loading;

  /** Son servis hatası; interceptor doldurur, ekranlar gösterir. */
  public readonly serviceError = this.flowService.serviceError;

  /** Elde geçerli bir oturum token'ı var mı. */
  public readonly isLoggedIn = this.flowService.isLoggedIn;

  /** Ekran metni. Kaynak yüklenmediyse ya da anahtar yoksa verilen varsayılan döner. */
  public getResource(key: string, value: string): string {
    return this.flowService.getResource(key, value);
  }

  /** Aynı anahtarlı isteği tekrarlamaz; şehir/şube listesi gibi veriler için. */
  public once<T>(key: string, load: () => Promise<T>): Promise<T> {
    return this.flowService.once(key, load);
  }

  /** once() önbelleğini verilen önek için temizler, veri yeniden çekilir. */
  public forget(prefix: string): void {
    this.flowService.forget(prefix);
  }

  /** Değeri şifreler. */
  public encryption(value: string): string {
    return this.cryptologyService.encryption(value);
  }

  /** Şifrelenmiş değeri çözer. */
  public decryption(value: string): string {
    return this.cryptologyService.decryption(value);
  }

  /** Özellik bu ortamda açık mı. */
  public isEnableFeature(code: FeatureCode): boolean {
    return this.featureFlagService.isEnableFeature(code);
  }

  /** Bir alanın doğrulama hatası; şablonda hata metnini göstermek için. */
  public getError(id: string): string {
    return this.flowService.getError(id);
  }

  /** Doğrulamayı tetikler ve geçerli adımın geçip geçmediğini döndürür. */
  public validateCurrentStep(): Promise<boolean> {
    return this.flowService.validateCurrentStep();
  }

  /** Doğrulama geçerse sonraki adıma geçer. */
  public next(): Promise<void> {
    return this.flowService.next();
  }

  /** Önceki adıma döner; doğrulama aranmaz. */
  public back(): Promise<void> {
    return this.flowService.back();
  }

  public navigate(target: string, keepState = false): Promise<boolean> {
    return this.flowService.navigate(target, keepState);
  }

  /** Yapılandırma butonunun görünür olup olmadığı. */
  public isButtonVisible(button: FlowButton): boolean {
    return this.flowService.isButtonVisible(button);
  }

  /** Yapılandırma butonunun tıklanması; tanımlıysa hedef adrese gider. */
  public clickButton(button: FlowButton): void {
    this.flowService.clickButton(button);
  }
}
