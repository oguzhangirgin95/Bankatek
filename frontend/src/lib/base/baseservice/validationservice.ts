import { Injectable } from '@angular/core';
import { ValidationError, ValidationRuleConfig, ValidatorEnum } from '../baseconfig/config';
import { BaseService } from './baseservice';

/**
 * Yapılandırmadaki doğrulama kurallarını çalıştırır.
 *
 * Değerin nereden okunacağını bilmez; onu dışarıdan verilen getValue
 * fonksiyonu sağlar. Bu sayede kural mantığı State'e bağlı kalmaz ve tek
 * başına test edilebilir.
 */
@Injectable({
  providedIn: 'root',
})
export class Validationservice extends BaseService {
  /**
   * Bütün kuralları sırayla dener ve geçemeyenlerin hatalarını döndürür.
   * İlk hatada durmaz; kullanıcı bütün eksikleri bir seferde görsün diye
   * hepsi toplanır.
   */
  public validate(rules: ValidationRuleConfig[] = [], getValue: (rule: ValidationRuleConfig) => any): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = getValue(rule);
      if (!this.isValid(rule, value)) {
        errors.push({ id: rule.id, message: rule.validationMessage });
      }
    }

    return errors;
  }

  /**
   * Tek bir kuralı dener.
   *
   * Özel kontrol tanımlıysa tür bakılmadan o çalışır. Tanınmayan tür geçerli
   * sayılır; yapılandırmaya yeni bir tür eklendiğinde ekran hata vermek yerine
   * o kuralı görmezden gelir.
   */
  public isValid(rule: ValidationRuleConfig, value: any): boolean {
    if (rule.customValidation) {
      return rule.customValidation(value);
    }

    // Sayı, boolean, null hepsi metne çevrilip tek biçimde denetlenir.
    const text = value === null || value === undefined ? '' : String(value);

    switch (rule.validatorType) {
      // Yalnızca boşluktan oluşan değer de boş sayılır.
      case ValidatorEnum.Required:
        return text.trim() !== '';

      // Desen verilmemişse kural yok sayılır, alan geçerli kabul edilir.
      case ValidatorEnum.Regex:
        return !rule.regex || new RegExp(rule.regex).test(text);

      // Sınır verilmemişse 0 kabul edilir, yani her değer geçer.
      case ValidatorEnum.MinLength:
        return text.length >= (rule.minLength ?? 0);

      // Sınır verilmemişse değerin kendi uzunluğu kullanılır, yani her değer geçer.
      case ValidatorEnum.MaxLength:
        return text.length <= (rule.maxLength ?? text.length);

      // Kabaca "bir şey @ bir şey . bir şey"; tam RFC denetimi amaçlanmıyor.
      case ValidatorEnum.Email:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

      // Boş metin Number() ile 0'a çevrildiği için ayrıca eleniyor.
      case ValidatorEnum.Number:
        return text.trim() !== '' && !isNaN(Number(text));

      default:
        return true;
    }
  }
}
