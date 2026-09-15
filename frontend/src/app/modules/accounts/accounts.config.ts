import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Hesaplar modülü. Arka planda iki hesap paneli arasında bakiye aktarılır.
 */
export const AccountsConfig: ModuleConfig = {
  code: 'MENU_ACCOUNTS',
  title: 'Hesaplar',
  color: '#34d399',
  background: '/assets/modules/hesap.svg',
  transactions: [
    { code: 'MENU_ACCOUNTLIST', title: 'Hesap Listesi', path: '/accounts/accountlist/start' },
  ],
};
