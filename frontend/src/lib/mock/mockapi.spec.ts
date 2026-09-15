import { describe, expect, it } from 'vitest';
import { MOCK_HANDLERS } from './mockapi';
import { CITIES, CUSTOMERS } from './mockdata';

function call(endpoint: string, body: unknown = {}): any {
  const handler = MOCK_HANDLERS[endpoint];

  expect(handler, `${endpoint} ucu tanimli degil`).toBeTypeOf('function');

  return handler(body);
}

describe('Mock uclari', () => {
  it('musteri listesi sehir filtresi ve sayfalama uygular', () => {
    const city = CITIES[0];
    const response = call('/customer/list', { cityId: city.id, pageNumber: 1, pageSize: 10 });

    expect(response.totalCount).toBe(CUSTOMERS.filter((customer) => customer.cityId === city.id).length);
    expect(response.customerList).toHaveLength(10);
    expect(response.customerList.every((row: any) => row.cityName === city.name)).toBe(true);
  });

  it('musteri aramasi ad ve musteri numarasinda calisir', () => {
    const customer = CUSTOMERS[0];
    const response = call('/customer/list', { searchText: customer.customerNumber });

    expect(response.totalCount).toBe(1);
    expect(response.customerList[0].fullName).toBe(customer.fullName);
  });

  it('musteri detayi bulunamayan kayit icin found=false doner', () => {
    expect(call('/customer/detail', { customerId: 'yok' }).found).toBe(false);
    expect(call('/customer/detail', { customerId: CUSTOMERS[0].id }).found).toBe(true);
  });

  it('hesap detayi musteri uzerinden bulunur ve bakiye bicimlenir', () => {
    const response = call('/account/detail', { customerId: CUSTOMERS[0].id });

    expect(response.found).toBe(true);
    expect(response.iban).toBe(CUSTOMERS[0].accountIban);
    expect(response.balance).toMatch(/^[0-9.]+,[0-9]{2} (TL|USD|EUR|gr)$/);
  });

  it('pano ozeti durum dagilimini toplamla tutarli uretir', () => {
    const response = call('/dashboard/summary', {});
    const total = response.statusDistribution.reduce((sum: number, item: any) => sum + item.count, 0);

    expect(response.totalCustomer).toBe(CUSTOMERS.length);
    expect(total).toBe(CUSTOMERS.length);
  });

  it('sube yogunlugu secili sehrin subelerini yuzdeyle doner', () => {
    const response = call('/dashboard/branchworkload', { cityId: '06' });

    expect(response.branches).toHaveLength(6);
    expect(Math.max(...response.branches.map((branch: any) => branch.loadPercent))).toBe(100);
  });

  it('transfer onayi ucret ve limit bilgisi hesaplar', () => {
    const customer = CUSTOMERS[0];
    const response = call('/transfer/createconfirm', {
      customerId: customer.id,
      type: 'EFT',
      receiverName: 'Anadolu Enerji A.Ş.',
      receiverIban: 'TR340006000000000000009999',
      amount: '5000',
    });

    expect(response.valid).toBe(true);
    expect(response.amount).toBe('5.000,00 TL');
    expect(response.fee).toBe('10,00 TL');
    expect(response.total).toBe('5.010,00 TL');
    expect(response.dailyTransferLimit).toBe(customer.dailyTransferLimit);
  });

  it('transfer calistirmasi gunluk sayaci artirir ve listeye ekler', () => {
    const customer = CUSTOMERS[1];
    const before = customer.dailyTransferCount;
    const listBefore = call('/transfer/list', { customerId: customer.id }).totalCount;

    const response = call('/transfer/createexecute', {
      customerId: customer.id,
      type: 'HAVALE',
      receiverName: 'Beyaz Yapı Market',
      receiverIban: 'TR340006000000000000008888',
      amount: '1250.5',
    });

    expect(response.success).toBe(true);
    expect(response.newTransferCount).toBe(before + 1);
    expect(response.amount).toBe('1.250,50 TL');
    expect(call('/transfer/list', { customerId: customer.id }).totalCount).toBe(listBefore + 1);
  });

  it('rapor girisi kapsami ozetler ve yeni rapor listeye eklenir', () => {
    const countBefore = call('/reportentry/list', {}).totalCount;

    const confirmed = call('/reportentry/confirm', {
      reportName: 'Ankara transfer raporu',
      reportType: 'TRANSFER',
      cityId: '06',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });

    expect(confirmed.valid).toBe(true);
    expect(confirmed.cityName).toBe('Ankara');
    expect(confirmed.customerCount).toBe(CUSTOMERS.filter((customer) => customer.cityId === '06').length);

    const executed = call('/reportentry/execute', {
      reportName: 'Ankara transfer raporu',
      reportType: 'TRANSFER',
      cityId: '06',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });

    expect(executed.success).toBe(true);
    expect(call('/reportentry/list', {}).totalCount).toBe(countBefore + 1);
  });

  it('ekran metinleri transaction yolunun son parcasindan bulunur', () => {
    const response = call('/resource/get', { transactionName: 'customers/customerlist' });
    const title = response.resources.find((item: any) => item.key === 'CUSTOMERLIST_TITLE');

    expect(title.value).toBe('Müşteri Listesi');
  });

  it('menu her modul icin en az bir ekran tasir', () => {
    const response = call('/menu/list', {});

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items.every((item: any) => (item.children ?? []).length > 0)).toBe(true);
  });
});
