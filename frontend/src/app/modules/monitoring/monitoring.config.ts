import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * İzleme modülü. Panoyu barındırır.
 */
export const MonitoringConfig: ModuleConfig = {
  code: 'MENU_MONITORING',
  title: 'İzleme',
  transactions: [
    { code: 'MENU_DASHBOARD', title: 'Pano', path: '/monitoring/dashboard/start' },
  ],
};
