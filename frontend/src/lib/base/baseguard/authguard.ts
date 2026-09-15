import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn } from '@angular/router';
import { FlowService } from '../baseservice/flowservice';
import { KeycloakService } from '../baseservice/keycloakservice';

/**
 * Oturum kontrolü. Token yoksa Keycloak'ın giriş sayfasına yönlendirir.
 *
 * Sunucu tarafı render'ında token localStorage'dan okunamadığı için kontrol
 * atlanıyor; yoksa her SSR isteği girişe yönlenir ve tarayıcıya boş sayfa
 * giderdi. Asıl kontrol tarayıcıda yapılıyor.
 */
export const AuthGuard: CanActivateFn = () => {
  const flowService = inject(FlowService);

  const keycloakService = inject(KeycloakService);

  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  if (flowService.isLoggedIn()) {
    return true;
  }

  keycloakService.login();

  return false;
};
