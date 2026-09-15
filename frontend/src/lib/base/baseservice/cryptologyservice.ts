import { Injectable } from '@angular/core';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { environment } from '@env/environment';
import { BaseService } from './baseservice';

/**
 * İstemci tarafında AES ile şifreleme ve çözme.
 *
 * Anahtar uygulama paketinin içinde olduğu için bu gerçek bir gizlilik
 * sağlamaz; tarayıcı kaynağına bakan biri anahtara ulaşabilir. Amaç yalnızca
 * değerin ağda ve depolamada düz metin durmaması. Gerçekten korunması gereken
 * veri sunucu tarafında şifrelenmeli.
 */
@Injectable({
  providedIn: 'root',
})
export class CryptologyService extends BaseService {
  private readonly key = Utf8.parse(environment.cryptoKey);

  /**
   * Başlangıç vektörü olarak anahtarın ilk 16 baytı kullanılır. Rastgele
   * olmadığı için aynı girdi hep aynı çıktıyı verir; şifrelenmiş değeri
   * saklayıp sonra çözebilmek bunu gerektiriyor.
   */
  private readonly iv = Utf8.parse(environment.cryptoKey.substring(0, 16));

  /** Şifreler. Boş değer boş döner. */
  public encryption(value: string): string {
    if (!value) {
      return '';
    }

    return AES.encrypt(value, this.key, { iv: this.iv }).toString();
  }

  /**
   * Çözer. Bozuk ya da başka bir anahtarla şifrelenmiş değerde hata fırlatmak
   * yerine boş döner; çağıran taraflar bunu "değer yok" diye ele alıyor.
   */
  public decryption(value: string): string {
    if (!value) {
      return '';
    }

    try {
      return AES.decrypt(value, this.key, { iv: this.iv }).toString(Utf8);
    } catch {
      return '';
    }
  }
}
