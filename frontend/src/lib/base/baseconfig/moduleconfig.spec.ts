import { describe, expect, it } from 'vitest';
import { AccountsConfig } from '../../../app/modules/accounts/accounts.config';
import { AnalyticsConfig } from '../../../app/modules/analytics/analytics.config';
import { BranchesConfig } from '../../../app/modules/branches/branches.config';
import { CustomersConfig } from '../../../app/modules/customers/customers.config';
import { MonitoringConfig } from '../../../app/modules/monitoring/monitoring.config';
import { RegionsConfig } from '../../../app/modules/regions/regions.config';
import { ReportsConfig } from '../../../app/modules/reports/reports.config';
import { SettingsConfig } from '../../../app/modules/settings/settings.config';
import { StorybookConfig } from '../../../app/modules/storybook/storybook.config';
import { TransfersConfig } from '../../../app/modules/transfers/transfers.config';
import { ModuleConfig } from './moduleconfig';

/**
 * Bütün modül yapılandırmaları. Yeni bir modül eklendiğinde buraya da
 * yazılmalı; aksi halde renginin ve arka planının tekil olduğu denetlenmez.
 */
const CONFIGS: ModuleConfig[] = [
  MonitoringConfig,
  CustomersConfig,
  AccountsConfig,
  TransfersConfig,
  RegionsConfig,
  BranchesConfig,
  ReportsConfig,
  AnalyticsConfig,
  SettingsConfig,
  StorybookConfig,
];

/** Modül kodundan adres önekine; her ekran kendi modülünün altında olmalı. */
const PREFIXES: Record<string, string> = {
  MENU_MONITORING: '/monitoring/',
  MENU_CUSTOMERS: '/customers/',
  MENU_ACCOUNTS: '/accounts/',
  MENU_TRANSFERS: '/transfers/',
  MENU_REGIONS: '/regions/',
  MENU_BRANCHES: '/branches/',
  MENU_REPORTS: '/reports/',
  MENU_ANALYTICS: '/analytics/',
  MENU_SETTINGS: '/settings/',
  MENU_STORYBOOK: '/storybook/',
};

/** Aynı değerden iki kez geçen var mı. */
const duplicates = (values: string[]): string[] =>
  values.filter((value, index) => values.indexOf(value) !== index);

describe('ModuleConfig', () => {
  it('her modulun kodu tekildir', () => {
    expect(duplicates(CONFIGS.map((config) => config.code))).toEqual([]);
  });

  it('her modulun rengi farklidir', () => {
    expect(duplicates(CONFIGS.map((config) => config.color))).toEqual([]);
  });

  it('renkler alti haneli hex olarak yazilir', () => {
    CONFIGS.forEach((config) => expect(config.color).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('her modulun arka plani farklidir', () => {
    expect(duplicates(CONFIGS.map((config) => config.background))).toEqual([]);
  });

  it('arka planlar modul gorselleri klasorunden gelir', () => {
    CONFIGS.forEach((config) => expect(config.background).toMatch(/^\/assets\/modules\/[a-z]+\.svg$/));
  });

  it('her modulun en az bir transactioni vardir', () => {
    CONFIGS.forEach((config) => expect(config.transactions.length).toBeGreaterThan(0));
  });

  it('ekranlar kendi modullerinin altindadir', () => {
    CONFIGS.forEach((config) =>
      config.transactions.forEach((item) => expect(item.path.startsWith(PREFIXES[config.code])).toBe(true)),
    );
  });

  it('ayni ekran iki modulde birden listelenmez', () => {
    expect(duplicates(CONFIGS.flatMap((config) => config.transactions.map((item) => item.path)))).toEqual([]);
  });

  it('butun adresler start adimiyla biter', () => {
    CONFIGS.forEach((config) =>
      config.transactions.forEach((item) => expect(item.path.endsWith('/start')).toBe(true)),
    );
  });
});
