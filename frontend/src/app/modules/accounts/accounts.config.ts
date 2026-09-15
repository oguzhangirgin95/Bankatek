import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Hesaplar modülü. Hesap envanterinin listelendiği ekranlar.
 */
export const AccountsConfig: ModuleConfig = {
  code: 'MENU_ACCOUNTS',
  title: 'Hesaplar',
  transactions: [
    { code: 'MENU_ACCOUNTLIST', title: 'Hesap Listesi', path: '/accounts/accountlist/start' },
  ],
};
