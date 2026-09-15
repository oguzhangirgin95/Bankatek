import { InjectionToken } from '@angular/core';

/**
 * İstekler '/api/...' adresine gider. Bu proje veriyi kendi içindeki mock
 * halkasından ürettiği için değer boş kalır; arkasına gerçek bir servis
 * takıldığında sunucu tarafı render'ında kullanılacak mutlak adres buraya
 * verilir.
 */
export const API_ORIGIN = new InjectionToken<string>('API_ORIGIN', {
  providedIn: 'root',
  factory: () => '',
});
