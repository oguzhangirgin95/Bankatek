import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Müşteriler modülü. Müşteri portföyünün listelendiği ekranlar.
 */
export const CustomersConfig: ModuleConfig = {
  code: 'MENU_CUSTOMERS',
  title: 'Müşteriler',
  transactions: [
    { code: 'MENU_CUSTOMERLIST', title: 'Müşteri Listesi', path: '/customers/customerlist/start' },
  ],
};
