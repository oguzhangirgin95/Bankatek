import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoginControllerService } from '@lib/services/api/loginController.service';
import { FeatureCode } from '../baseconfig/features';
import { BaseService } from './baseservice';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService extends BaseService {
  private readonly loginService = inject(LoginControllerService);

  /** Bu ortamda açık olan özellik kodları. */
  private readonly codes = signal<ReadonlySet<string>>(new Set());

  /** Liste bir kez alındı mı. Guard'ın gereksiz istek atmasını engeller. */
  private loaded = false;

  /** Açık bayrakların listesi; hata ayıklarken ne geldiğini görmek için. */
  readonly enabled = computed(() => [...this.codes()]);

  /**  Sunucudan gelen listeyi yazar. */
  setFeatures(features: string[] | undefined | null): void {
    this.codes.set(new Set((features ?? []).map((code) => code.trim().toUpperCase())));
    this.loaded = true;
  }

  clearFeatures(): void {
    this.codes.set(new Set());
    this.loaded = false;
    this.forget('Features');
  }

  async ensureLoaded(token: string | undefined): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (!token) {
      this.setFeatures([]);
      return;
    }

    try {
      const response = await this.once('Features', () =>
        firstValueFrom(this.loginService.currentUser({ token })),
      );
      this.setFeatures(response?.features);
    } catch (error) {
      console.error('Feature flags:', error);
      this.setFeatures([]);
    }
  }

  isEnableFeature(code: FeatureCode): boolean {
    return this.codes().has((code ?? '').trim().toUpperCase());
  }
}
