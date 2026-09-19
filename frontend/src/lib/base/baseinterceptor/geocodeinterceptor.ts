import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError } from 'rxjs';
import { GEOCODE_BASE_PATH } from '@lib/services/external/geocodeservice';
import { FlowService } from '../baseservice/flowservice';

/**
 * Adres sunucusuna (Nominatim) giden isteklerin halkası.
 *
 * WeatherInterceptor'ın hava durumu için yaptığının aynısını adres servisi için
 * yapar ve yalnızca kendi adresine karışır. Bilerek yapmadığı şeyler var:
 *
 * - Oturum token'ı eklemez; bu sunucunun Keycloak ile ilgisi yok
 * - X-Transaction / X-Step göndermez; iç bilgi dışarı çıkmaz
 * - Global yükleniyor sayacını artırmaz; adres gecikirse ekran kilitlenmez
 * - Hatasını State'teki serviceError'a yazmaz; kendi alanına yazar
 *
 * Kök adres boşsa (ortamda adres servisi tanımlı değil) hiçbir isteğe
 * karışmaz. Boş öneke `startsWith` uygulansaydı her istek eşleşirdi.
 */
export const GeocodeInterceptor: HttpInterceptorFn = (request, next) => {
  if (!GEOCODE_BASE_PATH || !request.url.startsWith(GEOCODE_BASE_PATH)) {
    return next(request);
  }

  const flowService = inject(FlowService);

  flowService.set('geocodeError', undefined);

  return next(request.clone({ setHeaders: { Accept: 'application/json' } })).pipe(
    retry({ count: 2, delay: 500 }),
    catchError((error: HttpErrorResponse) => {
      flowService.set('geocodeError', `${error.status} - ${error.statusText}`);

      return throwError(() => error);
    }),
  );
};
