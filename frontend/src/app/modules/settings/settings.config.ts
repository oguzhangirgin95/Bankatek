import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Ayarlar modülü. Arka planda baskı devre yollarında akım ilerler.
 */
export const SettingsConfig: ModuleConfig = {
  code: 'MENU_SETTINGS',
  title: 'Ayarlar',
  color: '#818cf8',
  background: '/assets/modules/devre.svg',
  transactions: [
    { code: 'MENU_PREFERENCES', title: 'Ayarlar', path: '/settings/preferences/start' },
  ],
};
