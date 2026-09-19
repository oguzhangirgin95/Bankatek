import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Bölgeler modülü. Arka planda eş yükselti eğrileri nefes alır, saha taranır.
 */
export const RegionsConfig: ModuleConfig = {
  code: 'MENU_REGIONS',
  title: 'Bölgeler',
  color: '#60a5fa',
  background: '/assets/modules/harita.svg',
  transactions: [
    { code: 'MENU_REGIONLIST', title: 'Şehirler', path: '/regions/regionlist/start' },
    { code: 'MENU_ADDRESSSEARCH', title: 'Adres Arama', path: '/regions/addresssearch/start' },
  ],
};
