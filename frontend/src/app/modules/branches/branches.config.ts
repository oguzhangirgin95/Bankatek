import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Şubeler modülü. Şube bazında yoğunluk ekranları.
 */
export const BranchesConfig: ModuleConfig = {
  code: 'MENU_BRANCHES',
  title: 'Şubeler',
  transactions: [
    { code: 'MENU_BRANCHLIST', title: 'Şube Yoğunluğu', path: '/branches/branchlist/start' },
  ],
};
