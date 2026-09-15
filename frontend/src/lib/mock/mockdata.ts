export interface MockCity {
  id: string;
  name: string;
  cityCode: string;
  x: number;
  y: number;
  sortOrder: number;
}

export interface MockBranch {
  id: string;
  name: string;
  cityId: string;
  seq: number;
}

export interface MockCustomer {
  id: string;
  customerNumber: string;
  fullName: string;
  age: number;
  segment: string;
  creditScore: number;
  photoUrl: string;
  phone: string;
  joinDate: string;
  cityId: string;
  branchId: string;
  status: string;
  transferType: string;
  dailyTransferCount: number;
  dailyTransferLimit: number;
  accountIban: string;
}

export interface MockAccount {
  iban: string;
  customerId: string;
  currency: string;
  productName: string;
  openYear: number;
  type: string;
  balance: number;
  lastTransactionDate: string;
  photoUrl: string;
}

export interface MockTransfer {
  id: string;
  customerId: string;
  cityId: string;
  branchId: string;
  type: string;
  receiverName: string;
  receiverIban: string;
  transferTime: string;
  amount: number;
  status: string;
}

export interface MockReport {
  reportNo: string;
  reportName: string;
  reportType: string;
  cityId: string;
  branchId: string;
  period: string;
  customerCount: number;
  transferCount: number;
  createdDate: string;
}

export const STATUS_NAMES: Record<string, string> = {
  AKTIF: 'Aktif',
  PASIF: 'Pasif',
  BLOKE: 'Bloke',
  TAKIPTE: 'Takipte',
};

export const TRANSFER_TYPE_NAMES: Record<string, string> = {
  HAVALE: 'Havale',
  EFT: 'EFT',
  FAST: 'FAST',
  SWIFT: 'SWIFT',
  OTOMATIK_ODEME: 'Otomatik Ödeme',
};

export const TRANSFER_STATUS_NAMES: Record<string, string> = {
  TAMAMLANDI: 'Tamamlandı',
  BEKLEMEDE: 'Beklemede',
  PLANLANDI: 'Planlandı',
};

export const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  VADESIZ: 'Vadesiz',
  VADELI: 'Vadeli',
  DOVIZ: 'Döviz',
  ALTIN: 'Altın',
};

export const REPORT_TYPE_NAMES: Record<string, string> = {
  MUSTERI: 'Müşteri raporu',
  TRANSFER: 'Transfer raporu',
  SUBE: 'Şube raporu',
  LIMIT: 'Limit raporu',
};

const FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'Emre', 'Burak',
  'Elif', 'Zeynep', 'Ayşe', 'Fatma', 'Merve', 'Selin', 'Kemal', 'Onur',
];

const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan',
];

const FEMALE_NAMES = ['Elif', 'Zeynep', 'Ayşe', 'Fatma', 'Merve', 'Selin'];

const SEGMENTS = ['Bireysel', 'Öncelikli', 'Özel Bankacılık', 'Ticari', 'KOBİ', 'Kurumsal'];

const STATUSES = ['AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'PASIF', 'BLOKE', 'TAKIPTE'];

const TRANSFER_TYPES = ['HAVALE', 'EFT', 'FAST', 'SWIFT', 'OTOMATIK_ODEME'];

const ACCOUNT_TYPES = ['VADESIZ', 'VADESIZ', 'VADELI', 'DOVIZ', 'ALTIN'];

const PRODUCT_NAMES = ['Maaş Hesabı', 'Birikim Hesabı', 'Vadeli Mevduat', 'Döviz Hesabı', 'Altın Hesabı'];

const RECEIVERS = [
  'Anadolu Enerji A.Ş.',
  'Marmara Lojistik Ltd.',
  'Ege Tarım Kooperatifi',
  'Beyaz Yapı Market',
  'Karadeniz Tekstil',
  'Toros Gıda Sanayi',
  'Başkent Sigorta',
  'Deniz Turizm A.Ş.',
];

export const CITIES: MockCity[] = [
  { id: '34', name: 'İstanbul', cityCode: '34', x: 15.7, y: 9.9, sortOrder: 1 },
  { id: '06', name: 'Ankara', cityCode: '06', x: 36.1, y: 20.7, sortOrder: 2 },
  { id: '35', name: 'İzmir', cityCode: '35', x: 6.0, y: 35.8, sortOrder: 3 },
  { id: '16', name: 'Bursa', cityCode: '16', x: 16.1, y: 18.1, sortOrder: 4 },
  { id: '07', name: 'Antalya', cityCode: '07', x: 24.8, y: 51.0, sortOrder: 5 },
  { id: '01', name: 'Adana', cityCode: '01', x: 49.1, y: 50.0, sortOrder: 6 },
  { id: '42', name: 'Konya', cityCode: '42', x: 34.1, y: 41.3, sortOrder: 7 },
  { id: '27', name: 'Gaziantep', cityCode: '27', x: 59.9, y: 49.3, sortOrder: 8 },
  { id: '38', name: 'Kayseri', cityCode: '38', x: 49.9, y: 32.7, sortOrder: 9 },
  { id: '55', name: 'Samsun', cityCode: '55', x: 54.4, y: 7.1, sortOrder: 10 },
  { id: '61', name: 'Trabzon', cityCode: '61', x: 72.2, y: 10.0, sortOrder: 11 },
  { id: '21', name: 'Diyarbakır', cityCode: '21', x: 74.9, y: 40.9, sortOrder: 12 },
  { id: '25', name: 'Erzurum', cityCode: '25', x: 80.4, y: 21.0, sortOrder: 13 },
  { id: '65', name: 'Van', cityCode: '65', x: 91.5, y: 35.1, sortOrder: 14 },
];

const ANKARA_BRANCHES = [
  'Çankaya Şubesi',
  'Keçiören Şubesi',
  'Yenimahalle Şubesi',
  'Etimesgut Şubesi',
  'Mamak Şubesi',
  'Kurumsal Şube',
];

const STANDARD_BRANCHES = ['Merkez Şubesi', 'Bölge Şubesi', 'Ticari Şube'];

const CUSTOMER_COUNTS: Record<string, number> = {
  '34': 48,
  '06': 36,
  '35': 30,
  '16': 21,
  '07': 24,
  '01': 18,
  '42': 15,
  '27': 18,
  '38': 12,
  '55': 12,
  '61': 9,
  '21': 15,
  '25': 9,
  '65': 9,
};

function buildBranches(): MockBranch[] {
  const branches: MockBranch[] = [];

  for (const city of CITIES) {
    const names = city.id === '06' ? ANKARA_BRANCHES : STANDARD_BRANCHES;

    names.forEach((name, index) => {
      branches.push({ id: `${city.id}-S${index + 1}`, name, cityId: city.id, seq: index + 1 });
    });
  }

  return branches;
}

export function buildIban(cityCode: string, index: number): string {
  return `TR${cityCode}0006${String(index).padStart(18, '0')}`;
}

function portraitUrl(fullName: string, index: number): string {
  const gender = FEMALE_NAMES.includes(fullName.split(' ')[0]) ? 'women' : 'men';

  return `https://randomuser.me/api/portraits/${gender}/${index % 100}.jpg`;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCustomers(branches: MockBranch[]): MockCustomer[] {
  const customers: MockCustomer[] = [];
  let index = 0;

  for (const city of CITIES) {
    const cityBranches = branches.filter((branch) => branch.cityId === city.id);
    const count = CUSTOMER_COUNTS[city.id] ?? 12;

    for (let i = 0; i < count; i++) {
      const branch = cityBranches[i % cityBranches.length];
      const fullName = `${FIRST_NAMES[index % 16]} ${LAST_NAMES[Math.floor(index / 3) % 12]}`;

      customers.push({
        id: `${city.cityCode}-${1001 + i}`,
        customerNumber: `${city.cityCode}${String(1001 + i).padStart(4, '0')}`,
        fullName,
        age: 24 + (index % 42),
        segment: SEGMENTS[index % 6],
        creditScore: 900 + (index % 801),
        photoUrl: portraitUrl(fullName, index),
        phone: `05${String(300000000 + index * 137).padStart(9, '0')}`,
        joinDate: isoDate(2005 + (index % 18), 1 + (index % 12), 1 + (index % 27)),
        cityId: city.id,
        branchId: branch.id,
        status: STATUSES[index % 7],
        transferType: TRANSFER_TYPES[index % 5],
        dailyTransferCount: 3 + (index % 8),
        dailyTransferLimit: 8,
        accountIban: buildIban(city.cityCode, 1001 + i),
      });

      index++;
    }
  }

  return customers;
}

function buildAccounts(customers: MockCustomer[]): MockAccount[] {
  return customers.map((customer, index) => {
    const type = ACCOUNT_TYPES[index % 5];
    const currency = type === 'DOVIZ' ? (index % 2 === 0 ? 'USD' : 'EUR') : type === 'ALTIN' ? 'XAU' : 'TRY';

    return {
      iban: customer.accountIban,
      customerId: customer.id,
      currency,
      productName: PRODUCT_NAMES[index % 5],
      openYear: 2016 + (index % 9),
      type,
      balance: Math.round((1500 + ((index * 13570) % 890000)) * 100) / 100,
      lastTransactionDate: isoDate(2026, 1 + (index % 9), 1 + (index % 27)),
      photoUrl: `/images/card/kart-${(index % 4) + 1}.svg`,
    };
  });
}

function buildTransfers(customers: MockCustomer[]): MockTransfer[] {
  const transfers: MockTransfer[] = [];

  customers.forEach((customer, index) => {
    const count = customer.dailyTransferCount;

    for (let j = 0; j < count; j++) {
      const status = j < count - 2 ? 'TAMAMLANDI' : j === count - 2 ? 'BEKLEMEDE' : 'PLANLANDI';

      transfers.push({
        id: `${customer.id}-T${j + 1}`,
        customerId: customer.id,
        cityId: customer.cityId,
        branchId: customer.branchId,
        type: j === 0 ? customer.transferType : TRANSFER_TYPES[(index + j) % 5],
        receiverName: RECEIVERS[(index + j) % 8],
        receiverIban: buildIban('00', 500000 + index * 7 + j),
        transferTime: `${String(8 + j).padStart(2, '0')}:${String((index * 7 + j * 11) % 60).padStart(2, '0')}`,
        amount: Math.round((150 + ((index * 1370 + j * 9110) % 48500)) * 100) / 100,
        status,
      });
    }
  });

  return transfers;
}

function buildReports(): MockReport[] {
  const types = ['MUSTERI', 'TRANSFER', 'SUBE', 'LIMIT'];
  const reports: MockReport[] = [];

  for (let i = 0; i < 8; i++) {
    const city = CITIES[i % CITIES.length];
    const type = types[i % 4];

    reports.push({
      reportNo: `RPR-2026${String(100 + i)}`,
      reportName: `${city.name} ${REPORT_TYPE_NAMES[type]}`,
      reportType: type,
      cityId: city.id,
      branchId: '',
      period: `2026-0${1 + (i % 9)} / 2026-0${1 + ((i + 2) % 9)}`,
      customerCount: 40 + i * 13,
      transferCount: 260 + i * 87,
      createdDate: isoDate(2026, 1 + (i % 9), 5 + i),
    });
  }

  return reports;
}

export const BRANCHES: MockBranch[] = buildBranches();
export const CUSTOMERS: MockCustomer[] = buildCustomers(BRANCHES);
export const ACCOUNTS: MockAccount[] = buildAccounts(CUSTOMERS);
export const TRANSFERS: MockTransfer[] = buildTransfers(CUSTOMERS);
export const REPORTS: MockReport[] = buildReports();

export function cityName(cityId: string | undefined): string {
  return CITIES.find((city) => city.id === cityId)?.name ?? '';
}

export function branchName(branchId: string | undefined): string {
  return BRANCHES.find((branch) => branch.id === branchId)?.name ?? '';
}

export function isOverDailyLimit(customer: MockCustomer): boolean {
  return customer.dailyTransferCount > customer.dailyTransferLimit;
}
