import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, EMPTY, firstValueFrom, Subject, switchMap } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { CustomerControllerService } from '@lib/services/api/customerController.service';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { TransferControllerService } from '@lib/services/api/transferController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { AccountControllerService } from '@lib/services/api/accountController.service';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Detailcard } from '@lib/commons/detailcard/detailcard';
import { Grid } from '@lib/commons/grid/grid';
import { Info } from '@lib/commons/info/info';
import { Input } from '@lib/commons/input/input';
import { List } from '@lib/commons/list/list';
import { Modal } from '@lib/commons/modal/modal';
import { Pagination } from '@lib/commons/pagination/pagination';
import { Select } from '@lib/commons/select/select';
import { Tabs } from '@lib/commons/tabs/tabs';

const PAGE_SIZE = 20;
const SEARCH_DELAY = 400;

@Component({
  imports: [Button, Card, Detailcard, FormsModule, Grid, Info, Input, List, Modal, Pagination, Select, Tabs],
  templateUrl: './customerlist.start.html',
  styleUrl: './customerlist.scss',
})
export class CustomerlistStart extends BaseComponent implements OnInit {
  private readonly customerService = inject(CustomerControllerService);
  private readonly accountService = inject(AccountControllerService);
  private readonly transferService = inject(TransferControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly search = new Subject<void>();

  readonly labels = computed(() => ({
    title: this.getResource('CUSTOMERLIST_TITLE', 'Müşteri Listesi'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    status: this.getResource('FILTER_STATUS', 'Durum'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    search: this.getResource('CUSTOMERLIST_SEARCH', 'Ad veya müşteri no'),
    clear: this.getResource('BUTTON_CLEAR', 'Temizle'),
    listTitle: this.getResource('CUSTOMERLIST_LIST', 'Müşteri'),
    listHint: this.getResource('CUSTOMERLIST_HINT', 'Detay için satıra tıklayın'),
    detailTitle: this.getResource('CUSTOMERLIST_DETAIL', 'Detay'),
    selectFirst: this.getResource('CUSTOMERLIST_SELECT', 'Listeden bir müşteri seçin.'),
    overLimit: this.getResource('CUSTOMERLIST_OVERLIMIT', 'Bu müşteri günlük transfer limitini aşmış.'),
    noAccount: this.getResource('CUSTOMERLIST_NOACCOUNT', 'Bu müşteriye tanımlı hesap yok.'),
    emptyList: this.getResource('CUSTOMERLIST_EMPTY', 'Kayıt bulunamadı'),
    emptyTransfer: this.getResource('CUSTOMERLIST_EMPTYTRANSFER', 'Transfer kaydı yok'),
    tabPerson: this.getResource('TAB_PERSON', 'Kişi'),
    tabAccount: this.getResource('TAB_ACCOUNT', 'Hesap'),
    tabTransfer: this.getResource('TAB_TRANSFER', 'Transferler'),
  }));

  readonly tabs = computed(() => [
    { id: 'kisi', title: this.labels().tabPerson },
    { id: 'hesap', title: this.labels().tabAccount },
    { id: 'transfer', title: this.labels().tabTransfer },
  ]);

  readonly columns = computed(() => [
    { field: 'customerNumber', title: this.getResource('GRID_CUSTOMERNO', 'Müşteri No') },
    { field: 'fullName', title: this.getResource('GRID_FULLNAME', 'Ad Soyad') },
    { field: 'segment', title: this.getResource('GRID_SEGMENT', 'Segment') },
    { field: 'cityName', title: this.getResource('GRID_CITY', 'Şehir') },
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'statusName', title: this.getResource('GRID_STATUS', 'Durum') },
    { field: 'transferTypeName', title: this.getResource('GRID_TRANSFERTYPE', 'Transfer') },
    { field: 'creditScore', title: this.getResource('GRID_CREDITSCORE', 'Kredi notu') },
  ]);

  readonly transferColumns = computed(() => [
    { field: 'transferTime', title: this.getResource('GRID_TIME', 'Saat') },
    { field: 'amount', title: this.getResource('GRID_AMOUNT', 'Tutar') },
    { field: 'typeName', title: this.getResource('GRID_TRANSFERTYPE', 'Transfer') },
    { field: 'receiverName', title: this.getResource('GRID_RECEIVER', 'Alıcı') },
    { field: 'statusName', title: this.getResource('GRID_STATUS', 'Durum') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', status: '', searchText: '', pageNumber: 1, pageSize: PAGE_SIZE };
    this.State.ActiveTab = 'kisi';

    this.getCityList();
    this.getBranchList();
    this.getStatusList();
    this.getCustomerList();

    this.search
      .pipe(
        debounceTime(SEARCH_DELAY),
        switchMap(() => this.customerService.customerList(this.State.Request).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.State.CustomerList = response?.customerList ?? [];
        this.State.TotalCount = response?.totalCount ?? 0;
      });
  }


  getCityList() {
    this.once('CityList', () => firstValueFrom(this.regionService.regionList({})))
      .then((response) => {
        this.State.CityList = (response?.regions ?? []).map((city) => ({ value: city.id, text: city.name }));
      })
      .catch((error) => console.error('City list:', error));
  }

  getBranchList() {
    this.once(`BranchList:${this.State.Request.cityId}`, () => firstValueFrom(this.branchService.branchList({ cityId: this.State.Request.cityId })))
      .then((response) => {
        this.State.BranchList = (response?.branches ?? []).map((branch) => ({ value: branch.id, text: branch.name }));
      })
      .catch((error) => console.error('Branch list:', error));
  }

  getStatusList() {
    this.once('StatusList', () => firstValueFrom(this.customerService.customerStatusList({})))
      .then((response) => {
        this.State.StatusList = (response?.statuses ?? []).map((status) => ({
          value: status.key,
          text: status.name,
        }));
      })
      .catch((error) => console.error('Status list:', error));
  }


  getCustomerList() {
    firstValueFrom(this.customerService.customerList(this.State.Request))
      .then((response) => {
        this.State.CustomerList = response?.customerList ?? [];
        this.State.TotalCount = response?.totalCount ?? 0;
      })
      .catch((error) => console.error('Customer list:', error));
  }

  setPage(page: number) {
    this.State.Request.pageNumber = page;
    this.getCustomerList();
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;
    this.State.Request.pageNumber = 1;

    if (key === 'cityId') {
      this.State.Request.branchId = '';
      this.getBranchList();
    }

    key === 'searchText' ? this.search.next() : this.getCustomerList();
  }

  clearFilter() {
    this.State.Request = { cityId: '', branchId: '', status: '', searchText: '', pageNumber: 1, pageSize: PAGE_SIZE };
    this.getBranchList();
    this.getCustomerList();
  }

  sortBy(field: string) {
    const sameField = this.State.Request.sortField === field;
    const direction = sameField && this.State.Request.sortDirection === 'ASC' ? 'DESC' : 'ASC';

    this.State.Request.sortField = field;
    this.State.Request.sortDirection = direction;
    this.getCustomerList();
  }


  closeDetail() {
    this.State.SelectedCustomerId = undefined;
  }

  selectCustomer(row: any) {
    this.State.SelectedCustomerId = row.id;
    this.State.ActiveTab = 'kisi';

    this.getCustomerDetail(row.id);
    this.getAccountDetail(row.id);
    this.getTransferList(row.id);
  }

  getCustomerDetail(customerId: string) {
    firstValueFrom(this.customerService.customerDetail({ customerId: customerId }))
      .then((response) => {
        this.State.CustomerDetail = response;
        this.State.CustomerItems = [
          { key: this.getResource('GRID_CUSTOMERNO', 'Müşteri No'), value: response?.customerNumber },
          { key: this.getResource('DETAIL_AGE', 'Yaş'), value: response?.age },
          { key: this.getResource('GRID_SEGMENT', 'Segment'), value: response?.segment },
          { key: this.getResource('GRID_CREDITSCORE', 'Kredi notu'), value: response?.creditScore },
          { key: this.getResource('GRID_CITY', 'Şehir'), value: response?.cityName },
          { key: this.getResource('GRID_BRANCH', 'Şube'), value: response?.branchName },
          { key: this.getResource('GRID_STATUS', 'Durum'), value: response?.statusName },
          { key: this.getResource('GRID_TRANSFERTYPE', 'Transfer'), value: response?.transferTypeName },
          {
            key: this.getResource('DETAIL_DAILYTRANSFER', 'Günlük transfer'),
            value: `${response?.dailyTransferCount} / ${response?.dailyTransferLimit}`,
          },
          { key: this.getResource('DETAIL_PHONE', 'Telefon'), value: response?.phone },
          { key: this.getResource('DETAIL_JOINDATE', 'Müşteri oluş tarihi'), value: response?.joinDate },
        ];
      })
      .catch((error) => console.error('Customer detail:', error));
  }

  getAccountDetail(customerId: string) {
    firstValueFrom(this.accountService.accountDetail({ customerId: customerId }))
      .then((response) => {
        this.State.AccountDetail = response;
        this.State.AccountItems = [
          { key: this.getResource('DETAIL_IBAN', 'IBAN'), value: response?.iban },
          { key: this.getResource('DETAIL_TYPE', 'Tip'), value: response?.type },
          { key: this.getResource('DETAIL_CURRENCY', 'Para birimi'), value: response?.currency },
          { key: this.getResource('DETAIL_PRODUCT', 'Ürün'), value: `${response?.productName} (${response?.openYear})` },
          { key: this.getResource('DETAIL_BALANCE', 'Bakiye'), value: response?.balance },
          { key: this.getResource('DETAIL_LASTTRANSACTION', 'Son işlem'), value: response?.lastTransactionDate },
        ];
      })
      .catch((error) => console.error('Account detail:', error));
  }

  getTransferList(customerId: string) {
    firstValueFrom(this.transferService.transferList({ customerId: customerId }))
      .then((response) => {
        this.State.TransferList = response?.transfers ?? [];
      })
      .catch((error) => console.error('Transfer list:', error));
  }
}
