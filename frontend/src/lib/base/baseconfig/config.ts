import { Type } from '@angular/core';
import { FeatureCode } from './features';

/**
 * Akış yapılandırmasının tip tanımları.
 *
 * Her transaction (örneğin accounts/accountlist) bir FlowConfig ile tanımlanır.
 * FlowService bu yapılandırmayı route verisinden okuyup adımları, doğrulamaları
 * ve butonları yönetir; böylece akış mantığı bileşen koduna gömülmez.
 */

/** Adım açılırken otomatik çağrılacak servis. Sonuç State'e '<adım>Response' olarak yazılır. */
export interface ServiceConfig {
  /** Injector'dan çözülecek servis sınıfı. */
  serviceName: Type<any>;
  /** Servis üzerinde çağrılacak metot adı. */
  methodName: string;
  /** Metot parametreleri. Metin verilenler State içindeki yol olarak çözülür. */
  params: any[];
}

/**
 * Tek bir alan için sade doğrulama tanımı.
 *
 * ValidationRuleConfig'in kısa biçimi; yalnızca zorunluluk ve desen gerektiren
 * basit durumlar için.
 */
export interface ValidationRule {
  /** Alan boş bırakılamaz. */
  required?: boolean;
  /** Değerin uyması gereken düzenli ifade. */
  regex?: string;
}

/** Alan id'sinden kurala eşleme. */
export interface ValidationConfig {
  [key: string]: ValidationRule;
}

/** Desteklenen doğrulama türleri. */
export enum ValidatorEnum {
  /** Boş olamaz; yalnızca boşluk içeren değer de geçersiz sayılır. */
  Required = 'required',
  /** Verilen düzenli ifadeye uymalı. */
  Regex = 'regex',
  /** En az minLength karakter olmalı. */
  MinLength = 'minLength',
  /** En fazla maxLength karakter olabilir. */
  MaxLength = 'maxLength',
  /** E-posta biçiminde olmalı. */
  Email = 'email',
  /** Sayıya çevrilebilmeli; boş değer geçersiz. */
  Number = 'number',
  /** Kontrolü customValidation fonksiyonu yapar. */
  Custom = 'custom',
}

/** Adım yapılandırmasında tanımlanan tek bir doğrulama kuralı. */
export interface ValidationRuleConfig {
  /** Doğrulanan alanın id'si; hata mesajı bu id ile eşleşir. */
  id: string;
  /** Okunacak State yolu. Boş bırakılırsa alan id'si yol kabul edilir. */
  value: any;
  /** Uygulanacak kural. Verilmezse kural yok sayılır ve alan geçerli kabul edilir. */
  validatorType?: ValidatorEnum;
  /** Custom türü için çalıştırılacak özel kontrol; verilirse türe bakılmadan bu çalışır. */
  customValidation?: (value: unknown, element?: HTMLInputElement) => boolean;
  /** Mesaj. 'KAYNAK_ANAHTARI|varsayılan metin' biçimi desteklenir. */
  validationMessage: string;
  /** Regex türü için desen. */
  regex?: string;
  /** MinLength türü için alt sınır. */
  minLength?: number;
  /** MaxLength türü için üst sınır. */
  maxLength?: number;
  /**  Özellik kodu. Verilirse kural yalnızca o bayrak açıkken uygulanır. */
  isEnable?: FeatureCode;
}

/** Doğrulama sonucu üretilen, ekranda gösterilecek hata. */
export interface ValidationError {
  /** Hatanın ait olduğu alanın id'si. */
  id: string;
  /** Kullanıcıya gösterilecek, çevrilmiş mesaj. */
  message: string;
}

/** Balonun hedefe göre duracağı yön. */
export type TourPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tanıtım turundaki tek bir durak. Duraklar dizideki sırayla gösterilir.
 *
 * Hedef, ekrandaki bir elemanın id'si ile bulunur; metinler
 * ValidationRuleConfig'teki gibi 'ANAHTAR|varsayılan metin' biçimini destekler.
 */
export interface TourStepConfig {
  /** Işık tutulacak elemanın id'si; ekranda benzersiz olmalı. */
  id: string;
  /** Balonun başlığı. */
  title: string;
  /** Balonun açıklaması. */
  text: string;
  /**
   * Balonun hedefe göre yeri. Verilmezse hedef ekranın alt yarısındaysa
   * üstünde, değilse altında gösterilir.
   */
  position?: TourPosition;
}

/** Akıştaki tek bir adım. Adı route path'i ile aynıdır. */
export interface FlowStep {
  /** Route path'i, örneğin 'start'. */
  step: string;
  /**
   * Adım şeridinde yazan başlık. 'ANAHTAR|varsayılan metin' biçimi desteklenir.
   *
   * Verilmezse şerit sıra numarasına düşer; tek adımlı akışlarda şerit hiç
   * çizilmediği için başlık da gerekmez.
   */
  title?: string;
  /** Bu adımda uygulanacak doğrulama kuralları. Kural yoksa boş dizi verilir. */
  validation: ValidationRuleConfig[];
  /** İleri butonu gösterilsin mi. Verilmezse gösterilmez. */
  showContinueButton?: boolean;
  /** Geri butonu gösterilsin mi. Verilmezse gösterilmez. */
  showBackButton?: boolean;
  /** Üst şerit gizlensin mi. Yalnızca açıkça false verilirse gizlenir. */
  showHeader?: boolean;
  /** Alt bant gizlensin mi. Yalnızca açıkça false verilirse gizlenir. */
  showFooter?: boolean;
  /** Menü gizlensin mi. Yalnızca açıkça false verilirse gizlenir. */
  showMenu?: boolean;
  /** Adım açılırken otomatik çağrılacak servis. */
  service?: ServiceConfig;
  /** True ise header, footer ve menü gizlenir; giriş ekranı bunu kullanıyor. */
  disableLayout?: boolean;
  /** True ise başka bir transaction'dan gelirken State temizlenmez. */
  keepState?: boolean;
  /** Adımın altında gösterilecek ek butonlar. */
  buttons?: FlowButton[];
  /** Bu adım ilk kez açıldığında sırayla gösterilecek tanıtım turu. */
  tour?: TourStepConfig[];
  /** Özellik kodu. Verilirse adım yalnızca o bayrak açıkken akışta yer alır. */
  isEnable?: FeatureCode;
}

/** Buton görünümü. Button bileşeni de aynı tipi kullanır. */
export type FlowButtonVariant = 'primary' | 'secondary' | 'outline';

/** isVisible fonksiyonuna verilen bağlam; State'i okumaya yarar. */
export interface FlowButtonVisibilityContext {
  /** Noktalı yol ile State'ten değer okur. */
  get<T>(key: string): T | undefined;
}

/** Adımın altında gösterilen, yapılandırmadan gelen buton. */
export interface FlowButton {
  /** Buton kimliği; aynı adımdaki butonları ayırt etmek için. */
  id: string;
  /** Buton yazısı. */
  label: string;
  /** Tıklanınca gidilecek adres. */
  navigate: string;
  /** Geriye dönük alan; yeni tanımlarda variant kullanılıyor. */
  color?: FlowButtonVariant;
  /** Buton görünümü. Verilmezse Button bileşeninin varsayılanı geçerli olur. */
  variant?: FlowButtonVariant;
  /**
   * Görünürlük üç biçimde verilebilir: doğrudan boolean, State içindeki bir
   * yolu gösteren metin ya da durumu okuyabilen bir fonksiyon. Verilmezse
   * buton görünür kabul edilir.
   */
  isVisible?: boolean | string | ((ctx: FlowButtonVisibilityContext) => boolean);
  /**  Özellik kodu. Verilirse buton yalnızca o bayrak açıkken görünür. */
  isEnable?: FeatureCode;
}

/**
 * Bir transaction'ın bütün adımlarını taşıyan kök yapılandırma.
 *
 * Route'un data alanına 'config' anahtarıyla konur; FlowService oradan okur.
 */
export interface FlowConfig {
  config: {
    /** Adımlar, akıştaki sırayla. İleri/geri gezinme bu sıraya göre çalışır. */
    steps: FlowStep[];
  };
}
