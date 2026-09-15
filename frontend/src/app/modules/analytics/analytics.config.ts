import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Analiz modülü. Arka planda benzen halkasının elektronları döner.
 */
export const AnalyticsConfig: ModuleConfig = {
  code: 'MENU_ANALYTICS',
  title: 'Analiz',
  color: '#a3e635',
  background: '/assets/modules/kimyasal.svg',
  transactions: [
    { code: 'MENU_TRANSFERTREND', title: 'Transfer Analizi', path: '/analytics/transfertrend/start' },
  ],
};
