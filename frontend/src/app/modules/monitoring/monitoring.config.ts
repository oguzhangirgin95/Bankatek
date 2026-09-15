import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * İzleme modülü. Panoyu barındırır; arka planda radar kadranı döner.
 */
export const MonitoringConfig: ModuleConfig = {
  code: 'MENU_MONITORING',
  title: 'İzleme',
  color: '#22d3ee',
  background: '/assets/modules/veri.svg',
  transactions: [
    { code: 'MENU_DASHBOARD', title: 'Pano', path: '/monitoring/dashboard/start' },
  ],
};
