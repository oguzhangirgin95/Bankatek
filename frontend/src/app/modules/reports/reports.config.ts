import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Raporlar modülü. Rapor listesi ve rapor girişi akışı.
 */
export const ReportsConfig: ModuleConfig = {
  code: 'MENU_REPORTS',
  title: 'Raporlar',
  transactions: [
    { code: 'MENU_REPORTLIST', title: 'Raporlar', path: '/reports/reportlist/start' },
    { code: 'MENU_REPORTENTRY', title: 'Rapor Girişi', path: '/reports/reportentry/start' },
  ],
};
