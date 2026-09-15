import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Raporlar modülü. Arka planda rapor sayfası taranır, dağılım sütunları dolar.
 */
export const ReportsConfig: ModuleConfig = {
  code: 'MENU_REPORTS',
  title: 'Raporlar',
  color: '#f87171',
  background: '/assets/modules/rapor.svg',
  transactions: [
    { code: 'MENU_REPORTLIST', title: 'Raporlar', path: '/reports/reportlist/start' },
    { code: 'MENU_REPORTENTRY', title: 'Rapor Girişi', path: '/reports/reportentry/start' },
  ],
};
