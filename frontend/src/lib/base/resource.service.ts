import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { Resource } from '@lib/services/model/resource';
import { ResourceRequest } from '@lib/services/model/resourceRequest';
import { ResourceResponse } from '@lib/services/model/resourceResponse';

/** Ekran metinlerinin durduğu klasör; her dil tek dosya: tr.json, en.json. */
const RESOURCE_PATH = '/resources/';

/**
 * Ekran metinlerini getirir.
 *
 * Metinler şimdilik sunucudan değil, dil başına tek bir JSON dosyasından
 * geliyor: `public/resources/tr.json`, `public/resources/en.json`. Hangi dilin
 * okunacağını ortam dosyasındaki `defaultLanguage` söyler.
 *
 * Yanıt `/resource/get` ucunun sözleşmesiyle aynı biçimde dönüyor; arkasına
 * gerçek servis takıldığında yerini `ResourceControllerService` alır ve
 * çağıran tarafta hiçbir şey değişmez.
 */
@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly httpClient = inject(HttpClient);

  /** Okunmuş dil dosyaları; her ekran için baştan istenmesin diye. */
  private readonly files = new Map<string, Observable<Resource[]>>();

  /**
   * Metin dosyasını okur.
   *
   * Dosya dil başına bir kez istenir, sonraki çağrılar aynı yanıtı paylaşır.
   * Bütün anahtarlar tek dosyada durduğu için `transactionName` ayırt edici
   * değil; yanıtta yalnızca geldiği gibi geri veriliyor.
   */
  public get(resourceRequest: ResourceRequest): Observable<ResourceResponse> {
    const language = environment.defaultLanguage;

    let file = this.files.get(language);

    if (!file) {
      file = this.httpClient.get<Record<string, string>>(`${RESOURCE_PATH}${language}.json`).pipe(
        map((values) => Object.entries(values ?? {}).map(([key, value]) => ({ key, value }))),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      this.files.set(language, file);
    }

    return file.pipe(map((resources) => ({ transactionName: resourceRequest.transactionName, resources })));
  }
}
