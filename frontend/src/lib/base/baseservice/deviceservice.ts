import { Injectable, afterNextRender, signal } from '@angular/core';

/** Dar ekran ya da parmakla kullanılan cihaz mobil sayılır. */
const MOBILE_QUERY = '(max-width: 900px), (pointer: coarse)';

/**
 * Cihazın mobil mi masaüstü mü olduğu.
 *
 * Tarayıcının medya sorgusu okunur; pencere daraltıldığında ya da telefon yan
 * çevrildiğinde sinyal kendiliğinden güncellenir.
 *
 * Sorgu ilk çizimden sonra okunuyor. Sunucu render'ında pencere olmadığı için
 * sayfa masaüstü çiziliyor; tarayıcı ilk çizimde farklı karar verseydi
 * hydration sunucudan gelen HTML ile uyuşmazlık hatası verirdi.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private readonly mobile = signal(false);

  /** Cihaz mobilse true. */
  public readonly isMobile = this.mobile.asReadonly();

  constructor() {
    afterNextRender(() => {
      const query = window.matchMedia(MOBILE_QUERY);
      const read = () => this.mobile.set(query.matches);

      read();
      query.addEventListener('change', read);
    });
  }
}
