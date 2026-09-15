import {
  ACCOUNTS,
  ACCOUNT_TYPE_NAMES,
  BRANCHES,
  CITIES,
  CUSTOMERS,
  MockCustomer,
  MockTransfer,
  REPORTS,
  REPORT_TYPE_NAMES,
  STATUS_NAMES,
  TRANSFERS,
  TRANSFER_STATUS_NAMES,
  TRANSFER_TYPE_NAMES,
  branchName,
  buildIban,
  cityName,
  isOverDailyLimit,
} from './mockdata';
import { MENU, resourcesFor } from './mockresources';

const REFERENCE_DATE = '2026-09-15';

const SETTINGS = {
  language: 'tr',
  pageSize: 20,
  defaultCityId: '',
  refreshSeconds: 0,
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: 'TL', USD: 'USD', EUR: 'EUR', XAU: 'gr' };

function formatMoney(value: number, currency = 'TRY'): string {
  const fixed = Math.abs(value).toFixed(2);
  const parts = fixed.split('.');
  const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';

  return `${sign}${grouped},${parts[1]} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

function paged<T>(rows: T[], pageNumber: unknown, pageSize: unknown): { rows: T[]; pageNumber: number; pageSize: number } {
  const page = Number(pageNumber ?? 0);
  const size = Number(pageSize ?? 0);

  if (page > 0 && size > 0) {
    return { rows: rows.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size };
  }

  return { rows, pageNumber: 0, pageSize: 0 };
}

function customerRow(customer: MockCustomer) {
  return {
    id: customer.id,
    customerNumber: customer.customerNumber,
    fullName: customer.fullName,
    segment: customer.segment,
    cityName: cityName(customer.cityId),
    branchName: branchName(customer.branchId),
    status: customer.status,
    statusName: STATUS_NAMES[customer.status] ?? customer.status,
    transferTypeName: TRANSFER_TYPE_NAMES[customer.transferType] ?? customer.transferType,
    creditScore: customer.creditScore,
    photoUrl: customer.photoUrl,
    overDailyLimit: isOverDailyLimit(customer),
  };
}

function transferRow(transfer: MockTransfer) {
  const customer = CUSTOMERS.find((item) => item.id === transfer.customerId);

  return {
    id: transfer.id,
    customerId: transfer.customerId,
    customerName: customer?.fullName ?? '',
    customerNumber: customer?.customerNumber ?? '',
    cityName: cityName(transfer.cityId),
    branchName: branchName(transfer.branchId),
    type: transfer.type,
    typeName: TRANSFER_TYPE_NAMES[transfer.type] ?? transfer.type,
    receiverName: transfer.receiverName,
    receiverIban: transfer.receiverIban,
    transferTime: transfer.transferTime,
    amount: formatMoney(transfer.amount),
    status: transfer.status,
    statusName: TRANSFER_STATUS_NAMES[transfer.status] ?? transfer.status,
  };
}

function sortCustomers(rows: MockCustomer[], field: unknown, direction: unknown): MockCustomer[] {
  const allowed = ['customerNumber', 'fullName', 'creditScore', 'age', 'dailyTransferCount'];
  const key = (typeof field === 'string' && allowed.includes(field) ? field : 'customerNumber') as keyof MockCustomer;
  const descending = typeof direction === 'string' && direction.toUpperCase() === 'DESC';

  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'tr');

    return descending ? -result : result;
  });
}

function filterCustomers(body: any): MockCustomer[] {
  const search = hasText(body?.searchText) ? String(body.searchText).trim().toLocaleLowerCase('tr') : '';

  return CUSTOMERS.filter((customer) => {
    if (hasText(body?.cityId) && customer.cityId !== body.cityId) {
      return false;
    }
    if (hasText(body?.branchId) && customer.branchId !== body.branchId) {
      return false;
    }
    if (hasText(body?.status) && customer.status !== body.status) {
      return false;
    }
    if (search) {
      const haystack = `${customer.fullName} ${customer.customerNumber}`.toLocaleLowerCase('tr');
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

function filterTransfers(body: any): MockTransfer[] {
  const overLimitIds = new Set(CUSTOMERS.filter(isOverDailyLimit).map((customer) => customer.id));

  return TRANSFERS.filter((transfer) => {
    if (hasText(body?.cityId) && transfer.cityId !== body.cityId) {
      return false;
    }
    if (hasText(body?.branchId) && transfer.branchId !== body.branchId) {
      return false;
    }
    if (hasText(body?.customerId) && transfer.customerId !== body.customerId) {
      return false;
    }
    if (hasText(body?.type) && transfer.type !== body.type) {
      return false;
    }
    if (hasText(body?.status) && transfer.status !== body.status) {
      return false;
    }
    if (body?.onlyOverLimit === true && !overLimitIds.has(transfer.customerId)) {
      return false;
    }

    return true;
  });
}

function dayLabels(dayCount: number): string[] {
  const labels: string[] = [];
  const reference = new Date(`${REFERENCE_DATE}T00:00:00Z`);

  for (let i = dayCount - 1; i >= 0; i--) {
    const day = new Date(reference.getTime() - i * 86400000);
    labels.push(`${String(day.getUTCDate()).padStart(2, '0')}.${String(day.getUTCMonth() + 1).padStart(2, '0')}`);
  }

  return labels;
}

function customerList(body: any) {
  const filtered = sortCustomers(filterCustomers(body), body?.sortField, body?.sortDirection);
  const page = paged(filtered, body?.pageNumber, body?.pageSize);

  return {
    customerList: page.rows.map(customerRow),
    totalCount: filtered.length,
    pageNumber: page.pageNumber,
    pageSize: page.pageSize,
  };
}

function customerDetail(body: any) {
  const customer = CUSTOMERS.find((item) => item.id === body?.customerId);

  if (!customer) {
    return { found: false };
  }

  return {
    found: true,
    id: customer.id,
    customerNumber: customer.customerNumber,
    fullName: customer.fullName,
    age: customer.age,
    segment: customer.segment,
    creditScore: customer.creditScore,
    photoUrl: customer.photoUrl,
    phone: customer.phone,
    joinDate: customer.joinDate,
    cityId: customer.cityId,
    cityName: cityName(customer.cityId),
    branchId: customer.branchId,
    branchName: branchName(customer.branchId),
    status: customer.status,
    statusName: STATUS_NAMES[customer.status] ?? customer.status,
    transferType: customer.transferType,
    transferTypeName: TRANSFER_TYPE_NAMES[customer.transferType] ?? customer.transferType,
    dailyTransferCount: customer.dailyTransferCount,
    dailyTransferLimit: customer.dailyTransferLimit,
    overDailyLimit: isOverDailyLimit(customer),
    accountIban: customer.accountIban,
  };
}

function accountList(body: any) {
  const search = hasText(body?.searchText) ? String(body.searchText).trim().toLocaleLowerCase('tr') : '';

  const filtered = ACCOUNTS.filter((account) => {
    const customer = CUSTOMERS.find((item) => item.id === account.customerId);

    if (hasText(body?.cityId) && customer?.cityId !== body.cityId) {
      return false;
    }
    if (hasText(body?.branchId) && customer?.branchId !== body.branchId) {
      return false;
    }
    if (hasText(body?.type) && account.type !== body.type) {
      return false;
    }
    if (search) {
      const haystack = `${account.iban} ${account.productName}`.toLocaleLowerCase('tr');
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const page = paged(filtered, body?.pageNumber, body?.pageSize);

  return {
    accounts: page.rows.map((account) => {
      const customer = CUSTOMERS.find((item) => item.id === account.customerId);

      return {
        iban: account.iban,
        customerId: account.customerId,
        customerName: customer?.fullName ?? '',
        currency: account.currency,
        productName: account.productName,
        openYear: account.openYear,
        type: ACCOUNT_TYPE_NAMES[account.type] ?? account.type,
        balance: formatMoney(account.balance, account.currency),
        cityName: cityName(customer?.cityId),
        branchName: branchName(customer?.branchId),
        photoUrl: account.photoUrl,
      };
    }),
    totalCount: filtered.length,
    pageNumber: page.pageNumber,
    pageSize: page.pageSize,
  };
}

function accountDetail(body: any) {
  const account = hasText(body?.iban)
    ? ACCOUNTS.find((item) => item.iban === body.iban)
    : ACCOUNTS.find((item) => item.customerId === body?.customerId);

  if (!account) {
    return { found: false };
  }

  const customer = CUSTOMERS.find((item) => item.id === account.customerId);

  return {
    found: true,
    iban: account.iban,
    customerId: account.customerId,
    currency: account.currency,
    productName: account.productName,
    openYear: account.openYear,
    type: ACCOUNT_TYPE_NAMES[account.type] ?? account.type,
    balance: formatMoney(account.balance, account.currency),
    lastTransactionDate: account.lastTransactionDate,
    photoUrl: account.photoUrl,
    branchName: branchName(customer?.branchId),
    cityName: cityName(customer?.cityId),
  };
}

function accountTypeList(body: any) {
  const scoped = ACCOUNTS.filter((account) => {
    const customer = CUSTOMERS.find((item) => item.id === account.customerId);

    if (hasText(body?.cityId) && customer?.cityId !== body.cityId) {
      return false;
    }
    if (hasText(body?.branchId) && customer?.branchId !== body.branchId) {
      return false;
    }

    return true;
  });

  return {
    types: Object.keys(ACCOUNT_TYPE_NAMES).map((key) => ({
      key,
      name: ACCOUNT_TYPE_NAMES[key],
      count: scoped.filter((account) => account.type === key).length,
    })),
  };
}

function transferTypeList(body: any) {
  const scoped = filterTransfers(body);

  return {
    types: Object.keys(TRANSFER_TYPE_NAMES).map((key) => ({
      key,
      name: TRANSFER_TYPE_NAMES[key],
      count: scoped.filter((transfer) => transfer.type === key).length,
    })),
  };
}

function transferList(body: any) {
  const filtered = filterTransfers(body);
  const page = paged(filtered, body?.pageNumber, body?.pageSize);

  return {
    transfers: page.rows.map(transferRow),
    totalCount: filtered.length,
    pageNumber: page.pageNumber,
    pageSize: page.pageSize,
  };
}

function transferFee(type: string, amount: number): number {
  if (type === 'FAST') {
    return money(Math.min(amount * 0.001, 12));
  }
  if (type === 'EFT') {
    return money(Math.min(amount * 0.002, 25));
  }
  if (type === 'SWIFT') {
    return money(Math.max(amount * 0.004, 120));
  }

  return 0;
}

function transferCreateConfirm(body: any) {
  const customer = CUSTOMERS.find((item) => item.id === body?.customerId);
  const amount = Number(body?.amount ?? 0);
  const type = String(body?.type ?? '');

  if (!customer) {
    return { valid: false, message: 'Müşteri bulunamadı.' };
  }

  const fee = transferFee(type, amount);

  return {
    valid: true,
    customerId: customer.id,
    customerName: customer.fullName,
    customerNumber: customer.customerNumber,
    branchName: branchName(customer.branchId),
    cityName: cityName(customer.cityId),
    typeName: TRANSFER_TYPE_NAMES[type] ?? type,
    receiverName: String(body?.receiverName ?? ''),
    receiverIban: String(body?.receiverIban ?? ''),
    amount: formatMoney(amount),
    currency: 'TRY',
    fee: formatMoney(fee),
    total: formatMoney(amount + fee),
    currentTransferCount: customer.dailyTransferCount,
    dailyTransferLimit: customer.dailyTransferLimit,
    willExceedLimit: customer.dailyTransferCount + 1 > customer.dailyTransferLimit,
    message: 'Bilgileri kontrol edip onaylayın.',
  };
}

function transferCreateExecute(body: any) {
  const customer = CUSTOMERS.find((item) => item.id === body?.customerId);
  const amount = Number(body?.amount ?? 0);
  const type = String(body?.type ?? '');

  if (!customer) {
    return { success: false, message: 'Müşteri bulunamadı.' };
  }

  customer.dailyTransferCount = customer.dailyTransferCount + 1;

  const transfer: MockTransfer = {
    id: `${customer.id}-T${customer.dailyTransferCount}`,
    customerId: customer.id,
    cityId: customer.cityId,
    branchId: customer.branchId,
    type,
    receiverName: String(body?.receiverName ?? ''),
    receiverIban: String(body?.receiverIban ?? buildIban('00', TRANSFERS.length)),
    transferTime: `${String(9 + (TRANSFERS.length % 9)).padStart(2, '0')}:00`,
    amount: money(amount),
    status: 'BEKLEMEDE',
  };

  TRANSFERS.push(transfer);

  return {
    success: true,
    transferId: transfer.id,
    customerName: customer.fullName,
    typeName: TRANSFER_TYPE_NAMES[type] ?? type,
    receiverName: transfer.receiverName,
    receiverIban: transfer.receiverIban,
    amount: formatMoney(transfer.amount),
    currency: 'TRY',
    newTransferCount: customer.dailyTransferCount,
    message: 'Transfer talimatı alındı.',
  };
}

function transferDelete(body: any) {
  const index = TRANSFERS.findIndex((transfer) => transfer.id === body?.transferId);

  if (index < 0) {
    return { success: false, message: 'Transfer bulunamadı.' };
  }

  TRANSFERS.splice(index, 1);

  return { success: true, message: 'Transfer silindi.' };
}

function summary(body: any) {
  const scoped = filterCustomers(body);

  const count = (status: string) => scoped.filter((customer) => customer.status === status).length;

  return {
    totalCustomer: scoped.length,
    active: count('AKTIF'),
    passive: count('PASIF'),
    blocked: count('BLOKE'),
    followUp: count('TAKIPTE'),
    overDailyLimit: scoped.filter(isOverDailyLimit).length,
    branchCount: new Set(scoped.map((customer) => customer.branchId)).size,
    statusDistribution: Object.keys(STATUS_NAMES).map((key) => ({
      key,
      name: STATUS_NAMES[key],
      count: count(key),
    })),
  };
}

function mapStatistics(body: any) {
  const cities = CITIES.map((city) => {
    const scoped = CUSTOMERS.filter((customer) => {
      if (customer.cityId !== city.id) {
        return false;
      }
      if (hasText(body?.branchId) && customer.branchId !== body.branchId) {
        return false;
      }
      if (hasText(body?.status) && customer.status !== body.status) {
        return false;
      }

      return true;
    });

    const active = scoped.filter((customer) => customer.status === 'AKTIF').length;

    return {
      cityId: city.id,
      cityName: city.name,
      cityCode: city.cityCode,
      x: city.x,
      y: city.y,
      totalCustomer: scoped.length,
      activeCustomer: active,
      overLimitCustomer: scoped.filter(isOverDailyLimit).length,
      activePercent: scoped.length === 0 ? 0 : Math.round((active / scoped.length) * 100),
      branchCount: BRANCHES.filter((branch) => branch.cityId === city.id).length,
    };
  });

  const busiest = [...cities].sort((left, right) => right.activeCustomer - left.activeCustomer)[0];

  return {
    cities,
    totalCustomer: cities.reduce((total, city) => total + city.totalCustomer, 0),
    activeCustomer: cities.reduce((total, city) => total + city.activeCustomer, 0),
    busiestCityName: busiest?.cityName ?? '',
    busiestCityActiveCustomer: busiest?.activeCustomer ?? 0,
  };
}

function branchWorkload(body: any) {
  const cityId = hasText(body?.cityId) ? String(body.cityId) : CITIES[0].id;
  const branches = BRANCHES.filter((branch) => branch.cityId === cityId);

  const rows = branches.map((branch) => {
    const scoped = CUSTOMERS.filter((customer) => {
      if (customer.branchId !== branch.id) {
        return false;
      }
      if (hasText(body?.status) && customer.status !== body.status) {
        return false;
      }

      return true;
    });

    const byType = (type: string) => scoped.filter((customer) => customer.transferType === type).length;

    return {
      branchId: branch.id,
      branchName: branch.name,
      totalCustomer: scoped.length,
      activeCustomer: scoped.filter((customer) => customer.status === 'AKTIF').length,
      transferLoad: scoped.reduce((total, customer) => total + customer.dailyTransferCount, 0),
      havale: byType('HAVALE'),
      eft: byType('EFT'),
      fast: byType('FAST'),
      swift: byType('SWIFT'),
      autoPayment: byType('OTOMATIK_ODEME'),
      loadPercent: 0,
    };
  });

  const maxLoad = rows.reduce((top, row) => Math.max(top, row.transferLoad), 0);

  rows.forEach((row) => {
    row.loadPercent = maxLoad === 0 ? 0 : Math.round((row.transferLoad / maxLoad) * 100);
  });

  return {
    cityId,
    cityName: cityName(cityId),
    branches: rows,
    totalTransferLoad: rows.reduce((total, row) => total + row.transferLoad, 0),
  };
}

function transferTrend(body: any) {
  const dayCount = Number(body?.dayCount ?? 7) || 7;

  const scoped = CUSTOMERS.filter((customer) => {
    if (hasText(body?.cityId) && customer.cityId !== body.cityId) {
      return false;
    }
    if (hasText(body?.branchId) && customer.branchId !== body.branchId) {
      return false;
    }

    return true;
  });

  const base = scoped.reduce((total, customer) => total + customer.dailyTransferCount, 0);
  const active = scoped.filter((customer) => customer.status === 'AKTIF').length;

  const points = dayLabels(dayCount).map((label, index) => ({
    label,
    transferCount: Math.round(base * (0.82 + ((index * 7) % 40) / 100)),
    activeCustomer: Math.round(active * (0.88 + ((index * 5) % 25) / 100)),
  }));

  const total = points.reduce((sum, point) => sum + point.transferCount, 0);

  return {
    cityName: hasText(body?.cityId) ? cityName(body.cityId) : 'Türkiye',
    points,
    totalTransferCount: total,
    averageTransferCount: points.length === 0 ? 0 : Math.round(total / points.length),
  };
}

function reportRow(report: (typeof REPORTS)[number]) {
  return {
    reportNo: report.reportNo,
    reportName: report.reportName,
    reportType: report.reportType,
    reportTypeName: REPORT_TYPE_NAMES[report.reportType] ?? report.reportType,
    cityName: cityName(report.cityId),
    branchName: branchName(report.branchId),
    period: report.period,
    customerCount: report.customerCount,
    transferCount: report.transferCount,
    createdDate: report.createdDate,
  };
}

function reportEntryConfirm(body: any) {
  const scoped = filterCustomers(body);

  if (!hasText(body?.reportName)) {
    return { valid: false, message: 'Rapor adı girilmeli.' };
  }

  return {
    valid: true,
    reportName: String(body.reportName),
    reportTypeName: REPORT_TYPE_NAMES[String(body?.reportType ?? '')] ?? String(body?.reportType ?? ''),
    cityName: hasText(body?.cityId) ? cityName(body.cityId) : 'Tümü',
    branchName: hasText(body?.branchId) ? branchName(body.branchId) : 'Tümü',
    period: `${body?.startDate ?? ''} / ${body?.endDate ?? ''}`,
    customerCount: scoped.length,
    transferCount: scoped.reduce((total, customer) => total + customer.dailyTransferCount, 0),
    message: 'Kapsamı onaylayın.',
  };
}

function reportEntryExecute(body: any) {
  const confirmed = reportEntryConfirm(body) as any;

  if (confirmed.valid !== true) {
    return { success: false, message: confirmed.message };
  }

  const report = {
    reportNo: `RPR-2026${String(200 + REPORTS.length)}`,
    reportName: confirmed.reportName,
    reportType: String(body?.reportType ?? 'MUSTERI'),
    cityId: String(body?.cityId ?? ''),
    branchId: String(body?.branchId ?? ''),
    period: confirmed.period,
    customerCount: confirmed.customerCount,
    transferCount: confirmed.transferCount,
    createdDate: REFERENCE_DATE,
  };

  REPORTS.unshift(report);

  return {
    success: true,
    reportNo: report.reportNo,
    reportName: report.reportName,
    reportTypeName: confirmed.reportTypeName,
    cityName: confirmed.cityName,
    period: report.period,
    customerCount: report.customerCount,
    transferCount: report.transferCount,
    createdDate: report.createdDate,
    message: 'Rapor oluşturuldu.',
  };
}

export const MOCK_HANDLERS: Record<string, (body: any) => unknown> = {
  '/customer/list': customerList,
  '/customer/detail': customerDetail,
  '/customer/statuslist': () => ({
    statuses: Object.keys(STATUS_NAMES).map((key) => ({ key, name: STATUS_NAMES[key] })),
  }),
  '/customer/save': (body: any) => ({ success: true, id: String(body?.id ?? ''), message: 'Müşteri kaydedildi.' }),
  '/customer/delete': () => ({ success: true, message: 'Müşteri silindi.' }),

  '/account/list': accountList,
  '/account/detail': accountDetail,
  '/account/typelist': accountTypeList,
  '/account/save': (body: any) => ({ success: true, iban: String(body?.iban ?? ''), message: 'Hesap kaydedildi.' }),
  '/account/delete': () => ({ success: true, message: 'Hesap silindi.' }),

  '/branch/list': (body: any) => {
    const rows = BRANCHES.filter((branch) => !hasText(body?.cityId) || branch.cityId === body.cityId);

    return {
      branches: rows.map((branch) => ({
        id: branch.id,
        name: branch.name,
        cityId: branch.cityId,
        cityName: cityName(branch.cityId),
      })),
      totalCount: rows.length,
    };
  },
  '/branch/save': (body: any) => ({ success: true, id: String(body?.id ?? ''), message: 'Şube kaydedildi.' }),
  '/branch/delete': () => ({ success: true, message: 'Şube silindi.' }),

  '/region/list': (body: any) => {
    const search = hasText(body?.searchText) ? String(body.searchText).toLocaleLowerCase('tr') : '';
    const rows = CITIES.filter((city) => !search || city.name.toLocaleLowerCase('tr').includes(search));

    return {
      regions: rows.map((city) => ({
        id: city.id,
        name: city.name,
        cityCode: city.cityCode,
        x: city.x,
        y: city.y,
      })),
      totalCount: rows.length,
    };
  },
  '/region/save': (body: any) => ({ success: true, id: String(body?.id ?? ''), message: 'Şehir kaydedildi.' }),
  '/region/delete': () => ({ success: true, message: 'Şehir silindi.' }),

  '/transfer/list': transferList,
  '/transfer/typelist': transferTypeList,
  '/transfer/createconfirm': transferCreateConfirm,
  '/transfer/createexecute': transferCreateExecute,
  '/transfer/delete': transferDelete,

  '/dashboard/summary': summary,
  '/dashboard/mapstatistics': mapStatistics,
  '/dashboard/branchworkload': branchWorkload,

  '/analytics/transfertrend': transferTrend,

  '/reportentry/list': (body: any) => {
    const rows = REPORTS.filter((report) => !hasText(body?.reportType) || report.reportType === body.reportType);

    return { reports: rows.map(reportRow), totalCount: rows.length };
  },
  '/reportentry/typelist': () => ({
    types: Object.keys(REPORT_TYPE_NAMES).map((key) => ({ key, name: REPORT_TYPE_NAMES[key] })),
  }),
  '/reportentry/confirm': reportEntryConfirm,
  '/reportentry/execute': reportEntryExecute,

  '/resource/get': (body: any) => ({ resources: resourcesFor(String(body?.transactionName ?? '')) }),

  '/menu/list': () => ({ items: MENU, totalCount: MENU.length }),

  '/setting/get': () => ({ success: true, ...SETTINGS, message: '' }),
  '/setting/save': (body: any) => {
    SETTINGS.language = String(body?.language ?? SETTINGS.language);
    SETTINGS.pageSize = Number(body?.pageSize ?? SETTINGS.pageSize);
    SETTINGS.defaultCityId = String(body?.defaultCityId ?? SETTINGS.defaultCityId);
    SETTINGS.refreshSeconds = Number(body?.refreshSeconds ?? SETTINGS.refreshSeconds);

    return { success: true, ...SETTINGS, message: 'Ayarlar kaydedildi.' };
  },

  '/login/currentuser': (body: any) => ({
    valid: true,
    username: 'demo',
    token: String(body?.token ?? 'bankatek-demo-token'),
    features: ['BNK-000'],
  }),
  '/login/eligable': () => ({ success: true, token: 'bankatek-demo-token', features: ['BNK-000'] }),
  '/login/logout': () => ({ success: true, message: 'Oturum kapatıldı.' }),
};
