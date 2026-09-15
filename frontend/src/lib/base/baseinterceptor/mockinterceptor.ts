import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { MOCK_HANDLERS } from '@lib/mock/mockapi';

const API_PREFIX = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;

const RESPONSE_DELAY = 80;

function endpointOf(url: string): string {
  const address = url.split('?')[0];

  if (address.startsWith(API_PREFIX)) {
    return `/${address.slice(API_PREFIX.length)}`;
  }

  const separator = address.indexOf('://');

  if (separator > 0) {
    const path = address.slice(address.indexOf('/', separator + 3));
    return path.startsWith(API_PREFIX) ? `/${path.slice(API_PREFIX.length)}` : path;
  }

  return address;
}

export const MockInterceptor: HttpInterceptorFn = (request, next) => {
  const endpoint = endpointOf(request.url);
  const handler = MOCK_HANDLERS[endpoint];

  if (!handler) {
    if (!request.url.startsWith(API_PREFIX) && request.url.indexOf(API_PREFIX) < 0) {
      return next(request);
    }

    return throwError(
      () => new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: request.url }),
    ).pipe(delay(RESPONSE_DELAY));
  }

  const body = handler(request.body ?? {});

  return of(new HttpResponse({ status: 200, statusText: 'OK', url: request.url, body })).pipe(delay(RESPONSE_DELAY));
};
