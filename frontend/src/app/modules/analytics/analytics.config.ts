import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Analiz modülü. Transfer trendi ve kanal dağılımı ekranları.
 */
export const AnalyticsConfig: ModuleConfig = {
  code: 'MENU_ANALYTICS',
  title: 'Analiz',
  transactions: [
    { code: 'MENU_TRANSFERTREND', title: 'Transfer Analizi', path: '/analytics/transfertrend/start' },
  ],
};
