import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Bileşenler modülü. Geliştirme vitrini; sunucudan gelen menüde yer almadığı
 * için yalnızca adres yazılarak açılır. Arka planda açı ölçer üzerinde yay çizilir.
 */
export const StorybookConfig: ModuleConfig = {
  code: 'MENU_STORYBOOK',
  title: 'Bileşenler',
  color: '#e879f9',
  background: '/assets/modules/egitim.svg',
  transactions: [
    { code: 'MENU_SHOWCASE', title: 'Bileşen Vitrini', path: '/storybook/showcase/start' },
    { code: 'MENU_PAGEBUILDER', title: 'Sayfa Kurucu', path: '/storybook/pagebuilder/start' },
  ],
};
