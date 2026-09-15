import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureCode } from '../baseconfig/features';
import { FeatureFlagService } from '../baseservice/featureflagservice';
import { FlowService } from '../baseservice/flowservice';

/** Özellik kapalıyken kullanıcının gönderileceği ekran. */
const FALLBACK = '/monitoring/dashboard/start';


export const FeatureGuard: CanActivateFn = async (route) => {
  const platformId = inject(PLATFORM_ID);
  const featureFlagService = inject(FeatureFlagService);
  const flowService = inject(FlowService);
  const router = inject(Router);

  const code = route.data['feature'] as FeatureCode | undefined;

  if (!code) {
    return true;
  }

  // Sunucu tarafı render'ında token okunamadığı için bayraklar bilinmiyor.
  // AuthGuard ile aynı yaklaşım: kontrolü tarayıcıya bırak, yoksa her SSR
  // isteği yönlenir ve sayfa boş döner.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  await featureFlagService.ensureLoaded(flowService.token());

  return featureFlagService.isEnableFeature(code) ? true : router.parseUrl(FALLBACK);
};
