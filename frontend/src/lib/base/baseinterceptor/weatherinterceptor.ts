import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError } from 'rxjs';
import { WEATHER_BASE_PATH } from '@lib/services/external/weatherservice';
import { FlowService } from '../baseservice/flowservice';

/**
 * Hava durumu servisine giden isteklerin halkası.
 *
 * BaseInterceptor'ın backend için yaptığının aynısını bu servis için yapar ve
 * yalnızca kendi adresine karışır. Bilerek yapmadığı şeyler var:
 *
 * - Oturum token'ı eklemez; bu sunucunun Keycloak ile ilgisi yok
 * - X-Transaction / X-Step göndermez; iç bilgi dışarı çıkmaz
 * - Global yükleniyor sayacını artırmaz; hava durumu gecikirse ekran kilitlenmez
 * - Hatasını State'teki serviceError'a yazmaz; kendi alanına yazar, böylece
 *   dış servisin çökmesi uygulamanın kendi hatasıymış gibi görünmez
 */
export const WeatherInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(WEATHER_BASE_PATH)) {
    return next(request);
  }

  const flowService = inject(FlowService);

  flowService.set('weatherError', undefined);

  return next(request.clone({ setHeaders: { Accept: 'application/json' } })).pipe(
    retry({ count: 2, delay: 500 }),
    catchError((error: HttpErrorResponse) => {
      flowService.set('weatherError', `${error.status} - ${error.statusText}`);

      return throwError(() => error);
    }),
  );
};
