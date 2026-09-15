import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Transferler modülü. Arka planda uçlar arası olay hattında paketler ilerler.
 */
export const TransfersConfig: ModuleConfig = {
  code: 'MENU_TRANSFERS',
  title: 'Transferler',
  color: '#f59e0b',
  background: '/assets/modules/olay.svg',
  transactions: [
    { code: 'MENU_TRANSFERLIST', title: 'Transfer Takibi', path: '/transfers/transferlist/start' },
    { code: 'MENU_TRANSFERCREATE', title: 'Transfer Oluştur', path: '/transfers/transfercreate/start' },
  ],
};
