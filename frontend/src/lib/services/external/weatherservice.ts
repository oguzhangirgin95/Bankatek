import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

/** Servisin kök adresi; ortam dosyasındaki weatherUrl'den gelir. */
export const WEATHER_BASE_PATH = environment.weather.url.endsWith('/')
  ? environment.weather.url
  : `${environment.weather.url}/`;

/** Bir konumun o anki hava durumu. */
export interface WeatherCurrent {
  /** Santigrat cinsinden sıcaklık. */
  temperature: number;
  /** Ölçümün zamanı, servisin döndürdüğü biçimde. */
  time: string;
}

interface ForecastResponse {
  current?: { temperature_2m?: number; time?: string };
}

/**
 * Hava durumu servisi.
 *
 * Backend'in üretilen servisleriyle aynı sözleşmeyi izler: kök adresi ortam
 * dosyasından okur, uç noktanın yolunu kendi içinde tutar, çağıran tarafa
 * yalnızca metot verir. Ekranlar adres kurmaz.
 *
 * İstekler WeatherInterceptor'dan geçer; oturum token'ı eklenmez.
 */
@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);

  /** Verilen konumun o anki sıcaklığı. */
  public current(latitude: number, longitude: number): Observable<WeatherCurrent> {
    const url = `${WEATHER_BASE_PATH}v1/forecast`;

    const params = {
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m',
    };

    return this.http.get<ForecastResponse>(url, { params }).pipe(
      map((response) => ({
        temperature: response?.current?.temperature_2m ?? 0,
        time: response?.current?.time ?? '',
      })),
    );
  }
}
