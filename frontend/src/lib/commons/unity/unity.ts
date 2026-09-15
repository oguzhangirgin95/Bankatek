import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/** Uygulamadan sahneye gönderilen mesaj. */
interface UnityMessage {
  objectName: string;
  methodName: string;
  value: string | number;
}

/**
 * Unity WebGL çıktısını gösteren alan.
 *
 * Çıktı kendi index.html'iyle birlikte bir iframe içinde açılıyor: yükleme,
 * canvas yönetimi ve WebGL bağlamı tamamen Unity'nin kendi şablonunda kalıyor.
 * Uygulama tarafında script yüklemek ya da dosya adı kurmak gerekmiyor; bileşen
 * yok edildiğinde iframe de gittiği için ayrıca kapatma çağrısı da yok.
 *
 * Adres ortam dosyasındaki `unity.url` alanından gelir.
 *
 * Sahneyle konuşma pencere mesajlarıyla:
 *   uygulama -> sahne : send('Map', 'SetData', json)
 *                       Unity şablonu message olayını dinleyip
 *                       unityInstance.SendMessage(...) çağırır.
 *   sahne -> uygulama : Unity tarafı parent.postMessage({ message: '34' }, '*')
 */
@Component({
  selector: 'app-unity',
  imports: [],
  templateUrl: './unity.html',
  styleUrl: './unity.scss',
})
export class Unity extends BaseComponent {
  /** Unity çıktısının adresi; içinde index.html beklenir. */
  readonly url = input<string>(environment.unity.url);

  /** Alanın en-boy oranı. Yükseklik yerine oran veriliyor; nedeni scss'te. */
  readonly ratio = input<string>('16 / 9');

  /**
   * Sahneye gönderilecek veri.
   *
   * Sahne hazır olduğunda ve veri her değiştiğinde kendiliğinden gönderilir;
   * ekranın hazır olmayı beklemesi ya da elle çağrı yapması gerekmez. Aynı
   * veri ikinci kez gönderilmez, şablonda nesne birebir yazılabilir.
   */
  readonly data = input<unknown>(null);

  /** Veriyi alan sahne nesnesi. */
  readonly target = input<string>('Map');

  /** Sahne nesnesinde çağrılacak metot. */
  readonly method = input<string>('SetData');

  /** Sahneden gelen mesaj. */
  readonly message = output<string>();

  /** Çerçeve yüklendi mi. */
  readonly ready = signal<boolean>(false);

  /** Çıktı bulunamadıysa gösterilecek metin; yoksa boş. */
  readonly error = signal<string>('');

  /**
   * Çerçeveye verilecek adres.
   *
   * Boş başlıyor: adres doğrulanmadan yüklenirse ve çıktı yoksa sunucu 404
   * yerine uygulamanın kendi sayfasını döndürür, uygulama kendi içinde açılır.
   */
  protected readonly source = signal<SafeResourceUrl | null>(null);

  readonly labels = computed(() => ({
    loading: this.getResource('UNITY_LOADING', 'Sahne yükleniyor'),
    failed: this.getResource('UNITY_FAILED', 'Sahne yüklenemedi'),
    hint: this.getResource('UNITY_HINT', 'Görüntü şu an gösterilemiyor.'),
  }));

  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  /** Sahneye en son gönderilen veri; aynısı ikinci kez gönderilmesin diye. */
  private sent = '';

  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Adres doğrulanana kadar çerçeveye verilen boş belge.
   *
   * Buraya null verilemez: Angular iframe'in src'sini resource URL bağlamında
   * sanitize eder ve güvenli olmayan değerde NG0904 fırlatır. Hata change
   * detection'ı kestiği için sayfanın geri kalanı da çizilmemiş oluyordu.
   */
  protected readonly blank = this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');

  constructor() {
    super();

    const destroyRef = inject(DestroyRef);

    // Her şey afterNextRender içinde: sunucu tarafında ne window vardır ne de
    // çerçevenin bir anlamı. Dinleyici host üzerinden kurulamıyor, çünkü olay
    // adı 'message' bileşenin aynı adlı çıkışıyla çakışıyor ve şablon denetimi
    // $event'i yanlış tipliyor.
    afterNextRender(() => {
      window.addEventListener('message', this.receive);
      destroyRef.onDestroy(() => window.removeEventListener('message', this.receive));

      this.start();
    });

    // Veri beslemesi bileşenin işi: her ekranda hazır olmayı bekleyen,
    // tekrarı eleyen kod yazılmasın diye.
    effect(() => {
      const data = this.data();

      if (!this.ready() || data === null) {
        return;
      }

      const payload = JSON.stringify(data);

      if (payload === this.sent) {
        return;
      }

      this.sent = payload;
      this.send(this.target(), this.method(), payload);
    });
  }

  /** Sahnedeki bir nesnenin metodunu çağırır. Sahne hazır değilse düşer. */
  send(objectName: string, methodName: string, value: string | number = ''): void {
    const payload: UnityMessage = { objectName, methodName, value };

    // Aynı kaynaktan servis edildiği için hedef kısıtlamaya gerek yok; çıktı
    // başka bir sunucuya taşınırsa burada origin verilmeli.
    this.frame().nativeElement.contentWindow?.postMessage(payload, '*');
  }

  /**
   * Sahneden gelen mesajı dışarı verir.
   *
   * Ok fonksiyon: removeEventListener'ın aynı referansı bulabilmesi için.
   */
  private readonly receive = (event: MessageEvent): void => {
    // Sayfadaki başka çerçeveler ve eklentiler de mesaj gönderir; yalnızca
    // kendi çerçevemizden geleni alıyoruz.
    if (event.source !== this.frame().nativeElement.contentWindow) {
      return;
    }

    const data = event.data as { message?: unknown } | string | null;
    const message = typeof data === 'object' && data !== null ? data.message : data;

    this.message.emit(String(message ?? ''));
  };

  /** Çerçeve yüklendiğinde katman kalkar. */
  protected loaded(): void {
    this.ready.set(true);
  }

  /** Adres uygulamanın kendi kökünde mi. Göreli adresler de kabul edilir. */
  private isSameOrigin(address: string): boolean {
    try {
      return new URL(address, window.location.origin).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Adresi doğrular ve çerçeveye verir.
   *
   * Çıktı yoksa sunucu 404 yerine uygulamanın kendi sayfasını döndürebilir;
   * bu yüzden yalnızca durum koduna değil, içerikte Unity'nin canvas'ı geçiyor
   * mu ona da bakılıyor.
   */
  private async start(): Promise<void> {
    const address = this.url();

    // bypassSecurityTrustResourceUrl Angular'ın sanitizer'ını devre dışı
    // bırakıyor; adres dışarıdan geldiği için önce kendi köküne ait mi diye
    // bakılıyor. Yoksa 'javascript:' ya da başka bir sunucunun adresi
    // doğrudan çerçeveye girebilirdi.
    if (!this.isSameOrigin(address)) {
      console.error('Unity adresi uygulamanın kökünde değil: ' + address);
      this.error.set(this.labels().failed);

      return;
    }

    try {
      const response = await fetch(address, { headers: { Accept: 'text/html' } });
      const html = await response.text();

      if (!response.ok || !html.includes('unity-canvas')) {
        throw new Error('Unity çıktısı bulunamadı: ' + address);
      }

      this.source.set(this.sanitizer.bypassSecurityTrustResourceUrl(address));
    } catch (reason) {
      console.error(reason);
      this.error.set(this.labels().failed);
    }
  }
}
