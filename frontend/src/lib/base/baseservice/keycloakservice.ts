import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Keycloak from 'keycloak-js';
import { environment } from '@env/environment';
import { FlowService } from './flowservice';

const DEMO_TOKEN = 'bankatek-demo-token';

const DEMO_USER = 'demo';

/**
 * Keycloak oturumu.
 *
 * Uygulamanın kendi giriş ekranı yok; kullanıcı adı ve şifre Keycloak'ın kendi
 * giriş sayfasında alınır. Uygulama açılırken init çalışır ve oturum yoksa
 * tarayıcı oraya yönlenir.
 *
 * Alınan token FlowService.token sinyaline yazılıyor; Authorization başlığını
 * üreten BaseInterceptor zaten orayı okuduğu için başka yere dokunulmuyor.
 */
@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private readonly flowService = inject(FlowService);

  private readonly platformId = inject(PLATFORM_ID);

  private client?: Keycloak;

  /** Token içindeki kullanıcı adı. Sunucu render'ında boş kalır. */
  public readonly username = signal<string>('');

  /**
   * Uygulama açılışında bir kez çağrılır. Sunucu tarafında hiçbir şey yapmaz:
   * keycloak-js window ve document'e dokunur, Node'da patlar.
   */
  public async init(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!environment.keycloak.url) {
      this.flowService.token.set(DEMO_TOKEN);
      this.username.set(DEMO_USER);

      return;
    }

    // Ortam dosyasindaki keycloak blogunda kurulum betiginin okudugu alanlar da
    // var; istemciye yalnizca kendi bekledigi ucu veriyoruz.
    const { url, realm, clientId } = environment.keycloak;

    const client = new Keycloak({ url, realm, clientId });
    this.client = client;

    // Süresi dolan token sessizce yenilenir; yenilenemiyorsa giriş sayfasına.
    client.onTokenExpired = () => client.updateToken(-1).then(() => this.read()).catch(() => this.login());

    // onLoad verilmiyor: Keycloak'tan dönüşteki kodu init zaten çözüyor. Oturum
    // yoksa aşağıdaki login çağrısı devreye giriyor.
    await client.init({ pkceMethod: 'S256', checkLoginIframe: false });

    if (!client.authenticated) {
      await this.login();
      return;
    }

    this.read();
  }

  /**
   * Keycloak'ın giriş sayfasına gider.
   *
   * prompt: 'login' → Keycloak'ta açık bir oturum olsa bile şifre yeniden
   * sorulur; sayfa her yenilendiğinde giriş ekranı gelir.
   *
   * Girişten sonra kök adrese (dashboard) dönülür. Verilmeseydi yenilenen
   * ekrana dönülürdü; State bellekte tutulduğu için o ekran boş açılıyordu.
   */
  public login(): Promise<void> {
    return this.client?.login({ prompt: 'login', redirectUri: `${window.location.origin}/` }) ?? Promise.resolve();
  }

  /** Keycloak oturumunu kapatır ve uygulamanın köküne döner. */
  public logout(): void {
    this.flowService.token.set(undefined);

    if (!this.client) {
      window.location.assign(window.location.origin);

      return;
    }

    this.client.logout({ redirectUri: window.location.origin });
  }

  /** İstemcideki güncel token'ı uygulamaya taşır. */
  private read(): void {
    this.flowService.token.set(this.client?.token);
    this.username.set(String(this.client?.tokenParsed?.['preferred_username'] ?? ''));
  }
}
