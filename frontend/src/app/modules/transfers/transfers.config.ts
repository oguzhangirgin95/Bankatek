import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Transferler modülü. Transfer takibi ve transfer oluşturma akışı.
 */
export const TransfersConfig: ModuleConfig = {
  code: 'MENU_TRANSFERS',
  title: 'Transferler',
  transactions: [
    { code: 'MENU_TRANSFERLIST', title: 'Transfer Takibi', path: '/transfers/transferlist/start' },
    { code: 'MENU_TRANSFERCREATE', title: 'Transfer Oluştur', path: '/transfers/transfercreate/start' },
  ],
};
