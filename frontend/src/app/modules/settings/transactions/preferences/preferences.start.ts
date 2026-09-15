import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { SettingControllerService } from '@lib/services/api/settingController.service';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Info } from '@lib/commons/info/info';
import { Input } from '@lib/commons/input/input';
import { Select } from '@lib/commons/select/select';

@Component({
  imports: [Button, Card, FormsModule, Info, Input, Select],
  templateUrl: './preferences.start.html',
  styleUrl: './preferences.scss',
})
export class PreferencesStart extends BaseComponent implements OnInit {
  private readonly settingService = inject(SettingControllerService);
  private readonly regionService = inject(RegionControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('PREFERENCES_TITLE', 'Ayarlar'),
    formTitle: this.getResource('PREFERENCES_FORM', 'Kullanıcı tercihleri'),
    language: this.getResource('PREFERENCES_LANGUAGE', 'Dil'),
    pageSize: this.getResource('PREFERENCES_PAGESIZE', 'Sayfa başına kayıt'),
    defaultCity: this.getResource('PREFERENCES_DEFAULTCITY', 'Varsayılan şehir'),
    refresh: this.getResource('PREFERENCES_REFRESH', 'Otomatik yenileme (sn)'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    save: this.getResource('BUTTON_SAVE', 'Kaydet'),
  }));

  readonly languageList = computed(() => [
    { value: 'tr', text: this.getResource('LANGUAGE_TR', 'Türkçe') },
    { value: 'en', text: this.getResource('LANGUAGE_EN', 'İngilizce') },
  ]);

  readonly pageSizeList = [
    { value: '10', text: '10' },
    { value: '20', text: '20' },
    { value: '50', text: '50' },
  ];

  constructor() {
    super();
  }

  ngOnInit() {
    // pageSize metin tutuluyor: seçenek değerleri metin olduğu için seçili
    // seçenek ancak böyle eşleşir. Servise giderken sayıya çevriliyor.
    this.State.Request = { token: this.flowService.token(), language: 'tr', pageSize: '20', defaultCityId: '', refreshSeconds: 0 };

    this.getCityList();
    this.getSetting();
  }

  getCityList() {
    this.once('CityList', () => firstValueFrom(this.regionService.regionList({})))
      .then((response) => {
        this.State.CityList = (response?.regions ?? []).map((city) => ({ value: city.id, text: city.name }));
      })
      .catch((error) => console.error('City list:', error));
  }

  getSetting() {
    firstValueFrom(this.settingService.settingGet({ token: this.flowService.token() }))
      .then((response) => {
        this.State.Request = {
          token: this.flowService.token(),
          language: response?.language ?? 'tr',
          pageSize: String(response?.pageSize ?? 20),
          defaultCityId: response?.defaultCityId ?? '',
          refreshSeconds: response?.refreshSeconds ?? 0,
        };
      })
      .catch((error) => console.error('Settings:', error));
  }

  saveSetting() {
    // Alan boşaltıldığında sayı alanı null döner; sunucu sıfır bekliyor.
    const request = {
      ...this.State.Request,
      pageSize: Number(this.State.Request.pageSize),
      refreshSeconds: Number(this.State.Request.refreshSeconds ?? 0),
    };

    firstValueFrom(this.settingService.settingSave(request))
      .then((response) => {
        this.State.Message = response?.message;
        this.flowService.set('language', response?.language);
      })
      .catch((error) => console.error('Setting save:', error));
  }
}
