import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Bölgeler modülü. Şehir bazlı dağılım ekranları.
 */
export const RegionsConfig: ModuleConfig = {
  code: 'MENU_REGIONS',
  title: 'Bölgeler',
  transactions: [
    { code: 'MENU_REGIONLIST', title: 'Şehirler', path: '/regions/regionlist/start' },
  ],
};
