import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { AnalyticsControllerService } from '@lib/services/api/analyticsController.service';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { TransferControllerService } from '@lib/services/api/transferController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { Barchart } from '@lib/commons/barchart/barchart';
import { Card } from '@lib/commons/card/card';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { Grid } from '@lib/commons/grid/grid';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';

@Component({
  imports: [Barchart, Card, Donutchart, FormsModule, Grid, Select, Statcard],
  templateUrl: './transfertrend.start.html',
  styleUrl: './transfertrend.scss',
})
export class TransfertrendStart extends BaseComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsControllerService);
  private readonly transferService = inject(TransferControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('TRANSFERTREND_TITLE', 'Transfer Analizi'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    trendTitle: this.getResource('TRANSFERTREND_CHART', 'Günlük transfer trendi'),
    typeChartTitle: this.getResource('TRANSFERLIST_TYPECHART', 'Transfer tipi dağılımı'),
    scope: this.getResource('TRANSFERTREND_SCOPE', 'Kapsam'),
    totalTransfer: this.getResource('TRANSFERTREND_TOTAL', 'Toplam transfer'),
    averageTransfer: this.getResource('TRANSFERTREND_AVERAGE', 'Günlük ortalama'),
  }));

  readonly columns = computed(() => [
    { field: 'label', title: this.getResource('GRID_DAY', 'Gün') },
    { field: 'transferCount', title: this.getResource('GRID_TRANSFERCOUNT', 'Transfer') },
    { field: 'activeCustomer', title: this.getResource('GRID_ACTIVECUSTOMER', 'Aktif') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '' };

    this.getCityList();
    this.getBranchList();
    this.getTransferTrend();
    this.getTypeList();
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

  getTransferTrend() {
    firstValueFrom(this.analyticsService.transferTrend(this.State.Request))
      .then((response) => {
        this.State.Trend = response;
        this.State.TrendChart = (response?.points ?? []).map((point) => ({
          label: point.label ?? '',
          value: point.transferCount ?? 0,
        }));
      })
      .catch((error) => console.error('Transfer trend:', error));
  }

  getTypeList() {
    firstValueFrom(this.transferService.transferTypeList({ cityId: this.State.Request.cityId }))
      .then((response) => {
        this.State.TypeChart = (response?.types ?? []).map((type) => ({
          label: type.name ?? '',
          value: type.count ?? 0,
        }));
      })
      .catch((error) => console.error('Transfer types:', error));
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;

    if (key === 'cityId') {
      this.State.Request.branchId = '';
      this.getBranchList();
      this.getTypeList();
    }

    this.getTransferTrend();
  }
}
