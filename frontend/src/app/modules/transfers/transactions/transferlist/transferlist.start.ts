import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { TransferControllerService } from '@lib/services/api/transferController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { Grid } from '@lib/commons/grid/grid';
import { Pagination } from '@lib/commons/pagination/pagination';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';

const PAGE_SIZE = 20;

@Component({
  imports: [Button, Card, Donutchart, FormsModule, Grid, Pagination, Select, Statcard],
  templateUrl: './transferlist.start.html',
  styleUrl: './transferlist.scss',
})
export class TransferlistStart extends BaseComponent implements OnInit {
  private readonly transferService = inject(TransferControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('TRANSFERLIST_TITLE', 'Transfer Takibi'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    type: this.getResource('FILTER_TRANSFERTYPE', 'Transfer tipi'),
    status: this.getResource('FILTER_STATUS', 'Durum'),
    limit: this.getResource('FILTER_LIMIT', 'Limit durumu'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    clear: this.getResource('BUTTON_CLEAR', 'Temizle'),
    total: this.getResource('TRANSFERLIST_TOTAL', 'Listelenen transfer'),
    listTitle: this.getResource('TRANSFERLIST_LIST', 'Transferler'),
    typeChartTitle: this.getResource('TRANSFERLIST_TYPECHART', 'Transfer tipi dağılımı'),
    empty: this.getResource('TRANSFERLIST_EMPTY', 'Transfer bulunamadı'),
    onlyOverLimit: this.getResource('TRANSFERLIST_ONLYOVERLIMIT', 'Limiti aşanlar'),
  }));

  readonly statusList = computed(() => [
    { value: 'TAMAMLANDI', text: this.getResource('TRANSFERSTATUS_DONE', 'Tamamlandı') },
    { value: 'BEKLEMEDE', text: this.getResource('TRANSFERSTATUS_PENDING', 'Beklemede') },
    { value: 'PLANLANDI', text: this.getResource('TRANSFERSTATUS_PLANNED', 'Planlandı') },
  ]);

  readonly limitList = computed(() => [{ value: '1', text: this.labels().onlyOverLimit }]);

  readonly columns = computed(() => [
    { field: 'customerNumber', title: this.getResource('GRID_CUSTOMERNO', 'Müşteri No') },
    { field: 'customerName', title: this.getResource('GRID_FULLNAME', 'Ad Soyad') },
    { field: 'cityName', title: this.getResource('GRID_CITY', 'Şehir') },
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'typeName', title: this.getResource('GRID_TRANSFERTYPE', 'Transfer') },
    { field: 'receiverName', title: this.getResource('GRID_RECEIVER', 'Alıcı') },
    { field: 'transferTime', title: this.getResource('GRID_TIME', 'Saat') },
    { field: 'amount', title: this.getResource('GRID_AMOUNT', 'Tutar') },
    { field: 'statusName', title: this.getResource('GRID_STATUS', 'Durum') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', type: '', status: '', onlyOverLimit: false, pageNumber: 1, pageSize: PAGE_SIZE };

    this.getCityList();
    this.getBranchList();
    this.getTypeList();
    this.getTransferList();
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
    firstValueFrom(this.transferService.transferTypeList({ cityId: this.State.Request.cityId }))
      .then((response) => {
        this.State.TypeList = (response?.types ?? []).map((type) => ({ value: type.key, text: type.name }));
        this.State.TypeChart = (response?.types ?? []).map((type) => ({
          label: type.name ?? '',
          value: type.count ?? 0,
        }));
      })
      .catch((error) => console.error('Transfer types:', error));
  }


  getTransferList() {
    firstValueFrom(this.transferService.transferList(this.State.Request))
      .then((response) => {
        this.State.TransferList = response?.transfers ?? [];
        this.State.TotalCount = response?.totalCount ?? 0;
      })
      .catch((error) => console.error('Transfer list:', error));
  }

  setPage(page: number) {
    this.State.Request.pageNumber = page;
    this.getTransferList();
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;
    this.State.Request.pageNumber = 1;

    if (key === 'cityId') {
      this.State.Request.branchId = '';
      this.getBranchList();
      this.getTypeList();
    }

    this.getTransferList();
  }

  setOverLimit(value: string) {
    this.State.Request.onlyOverLimit = value === '1';
    this.getTransferList();
  }

  clearFilter() {
    this.State.Request = { cityId: '', branchId: '', type: '', status: '', onlyOverLimit: false, pageNumber: 1, pageSize: PAGE_SIZE };
    this.getBranchList();
    this.getTypeList();
    this.getTransferList();
  }
}
