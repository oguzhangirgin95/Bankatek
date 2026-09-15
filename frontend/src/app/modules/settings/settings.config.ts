import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Ayarlar modülü. Kullanıcı tercihlerinin tutulduğu ekranlar.
 */
export const SettingsConfig: ModuleConfig = {
  code: 'MENU_SETTINGS',
  title: 'Ayarlar',
  transactions: [
    { code: 'MENU_PREFERENCES', title: 'Ayarlar', path: '/settings/preferences/start' },
  ],
};
