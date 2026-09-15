import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Müşteriler modülü. Arka planda Büyük Köpek takımyıldızı, Sirius parlar.
 */
export const CustomersConfig: ModuleConfig = {
  code: 'MENU_CUSTOMERS',
  title: 'Müşteriler',
  color: '#a78bfa',
  background: '/assets/modules/kopek.svg',
  transactions: [
    { code: 'MENU_CUSTOMERLIST', title: 'Müşteri Listesi', path: '/customers/customerlist/start' },
  ],
};
