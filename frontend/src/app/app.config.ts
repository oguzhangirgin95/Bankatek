import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BaseInterceptor } from '@lib/base/baseinterceptor/baseinterceptor';
import { WeatherInterceptor } from '@lib/base/baseinterceptor/weatherinterceptor';
import { GeocodeInterceptor } from '@lib/base/baseinterceptor/geocodeinterceptor';
import { MockInterceptor } from '@lib/base/baseinterceptor/mockinterceptor';
import { provideApi } from '@lib/services/provide-api';
import { environment } from '@env/environment';
import { KeycloakService } from '@lib/base/baseservice/keycloakservice';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([BaseInterceptor, WeatherInterceptor, GeocodeInterceptor, MockInterceptor]),
    ),
    provideApi(environment.apiUrl),
    provideAppInitializer(() => inject(KeycloakService).init()),
  ]
};
