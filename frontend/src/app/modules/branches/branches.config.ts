import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Şubeler modülü. Arka planda şube düğümleri merkezden sinyal alır.
 */
export const BranchesConfig: ModuleConfig = {
  code: 'MENU_BRANCHES',
  title: 'Şubeler',
  color: '#f472b6',
  background: '/assets/modules/ag.svg',
  transactions: [
    { code: 'MENU_BRANCHLIST', title: 'Şube Yoğunluğu', path: '/branches/branchlist/start' },
  ],
};
