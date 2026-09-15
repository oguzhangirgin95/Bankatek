import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, EMPTY, firstValueFrom, Subject, switchMap } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { AccountControllerService } from '@lib/services/api/accountController.service';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Detailcard } from '@lib/commons/detailcard/detailcard';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { Grid } from '@lib/commons/grid/grid';
import { Info } from '@lib/commons/info/info';
import { Input } from '@lib/commons/input/input';
import { Modal } from '@lib/commons/modal/modal';
import { Pagination } from '@lib/commons/pagination/pagination';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';

const PAGE_SIZE = 20;
const SEARCH_DELAY = 400;

@Component({
  imports: [Button, Card, Detailcard, Donutchart, FormsModule, Grid, Info, Input, Modal, Pagination, Select, Statcard],
  templateUrl: './accountlist.start.html',
  styleUrl: './accountlist.scss',
})
export class AccountlistStart extends BaseComponent implements OnInit {
  private readonly accountService = inject(AccountControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly search = new Subject<void>();

  readonly labels = computed(() => ({
    title: this.getResource('ACCOUNTLIST_TITLE', 'Hesap Listesi'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    type: this.getResource('FILTER_TYPE', 'Hesap tipi'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    search: this.getResource('ACCOUNTLIST_SEARCH', 'IBAN veya ürün'),
    clear: this.getResource('BUTTON_CLEAR', 'Temizle'),
    listTitle: this.getResource('ACCOUNTLIST_LIST', 'Hesaplar'),
    listHint: this.getResource('ACCOUNTLIST_HINT', 'Detay için satıra tıklayın'),
    detailTitle: this.getResource('ACCOUNTLIST_DETAIL', 'Hesap detayı'),
    selectFirst: this.getResource('ACCOUNTLIST_SELECT', 'Listeden bir hesap seçin.'),
    typeChartTitle: this.getResource('ACCOUNTLIST_TYPECHART', 'Tip dağılımı'),
    total: this.getResource('ACCOUNTLIST_TOTAL', 'Listelenen hesap'),
    empty: this.getResource('ACCOUNTLIST_EMPTY', 'Hesap bulunamadı'),
  }));

  readonly columns = computed(() => [
    { field: 'iban', title: this.getResource('GRID_IBAN', 'IBAN') },
    { field: 'type', title: this.getResource('GRID_TYPE', 'Tip') },
    { field: 'currency', title: this.getResource('GRID_CURRENCY', 'Para birimi') },
    { field: 'productName', title: this.getResource('GRID_PRODUCT', 'Ürün') },
    { field: 'openYear', title: this.getResource('GRID_OPENYEAR', 'Yıl') },
    { field: 'balance', title: this.getResource('GRID_BALANCE', 'Bakiye') },
    { field: 'cityName', title: this.getResource('GRID_CITY', 'Şehir') },
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'customerName', title: this.getResource('GRID_ASSIGNED', 'Müşteri') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', type: '', searchText: '', pageNumber: 1, pageSize: PAGE_SIZE };

    this.getCityList();
    this.getBranchList();
    this.getTypeList();
    this.getAccountList();

    this.search
      .pipe(
        debounceTime(SEARCH_DELAY),
        switchMap(() => this.accountService.accountList(this.State.Request).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.State.AccountList = response?.accounts ?? [];
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

  getTypeList() {
    this.once('AccountTypeList', () => firstValueFrom(this.accountService.accountTypeList({})))
      .then((response) => {
        this.State.TypeCounts = response?.types ?? [];
        this.State.TypeList = (response?.types ?? []).map((type) => ({ value: type.key, text: type.name }));
        this.State.TypeChart = (response?.types ?? []).map((type) => ({
          label: type.name ?? '',
          value: type.count ?? 0,
        }));
      })
      .catch((error) => console.error('Account types:', error));
  }


  getAccountList() {
    firstValueFrom(this.accountService.accountList(this.State.Request))
      .then((response) => {
        this.State.AccountList = response?.accounts ?? [];
        this.State.TotalCount = response?.totalCount ?? 0;
      })
      .catch((error) => console.error('Account list:', error));
  }

  setPage(page: number) {
    this.State.Request.pageNumber = page;
    this.getAccountList();
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;
    this.State.Request.pageNumber = 1;

    if (key === 'cityId') {
      this.State.Request.branchId = '';
      this.getBranchList();
    }

    key === 'searchText' ? this.search.next() : this.getAccountList();
  }

  clearFilter() {
    this.State.Request = { cityId: '', branchId: '', type: '', searchText: '', pageNumber: 1, pageSize: PAGE_SIZE };
    this.getBranchList();
    this.getAccountList();
  }


  closeDetail() {
    this.State.SelectedIban = undefined;
  }

  selectAccount(row: any) {
    this.State.SelectedIban = row.iban;

    firstValueFrom(this.accountService.accountDetail({ iban: row.iban }))
      .then((response) => {
        this.State.AccountDetail = response;
        this.State.AccountItems = [
          { key: this.getResource('DETAIL_IBAN', 'IBAN'), value: response?.iban },
          { key: this.getResource('DETAIL_TYPE', 'Tip'), value: response?.type },
          { key: this.getResource('DETAIL_CURRENCY', 'Para birimi'), value: response?.currency },
          { key: this.getResource('DETAIL_PRODUCT', 'Ürün'), value: `${response?.productName} (${response?.openYear})` },
          { key: this.getResource('DETAIL_BALANCE', 'Bakiye'), value: response?.balance },
          { key: this.getResource('DETAIL_LASTTRANSACTION', 'Son işlem'), value: response?.lastTransactionDate },
          { key: this.getResource('GRID_CITY', 'Şehir'), value: response?.cityName },
          { key: this.getResource('GRID_BRANCH', 'Şube'), value: response?.branchName },
        ];
      })
      .catch((error) => console.error('Account detail:', error));
  }
}
