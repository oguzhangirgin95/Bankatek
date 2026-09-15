import { ModuleConfig } from '@lib/base/baseconfig/moduleconfig';

/**
 * Bileşenler modülü. Geliştirme vitrini; sunucudan gelen menüde yer almadığı
 * için yalnızca adres yazılarak açılır, açıldığında kendi menüsünü gösterir.
 */
export const StorybookConfig: ModuleConfig = {
  code: 'MENU_STORYBOOK',
  title: 'Bileşenler',
  transactions: [
    { code: 'MENU_SHOWCASE', title: 'Bileşen Vitrini', path: '/storybook/showcase/start' },
    { code: 'MENU_PAGEBUILDER', title: 'Sayfa Kurucu', path: '/storybook/pagebuilder/start' },
  ],
};
