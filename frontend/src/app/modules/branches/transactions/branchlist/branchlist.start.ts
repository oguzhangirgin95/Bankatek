import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { DashboardControllerService } from '@lib/services/api/dashboardController.service';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { Barchart } from '@lib/commons/barchart/barchart';
import { Card } from '@lib/commons/card/card';
import { Grid } from '@lib/commons/grid/grid';
import { Info } from '@lib/commons/info/info';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';

@Component({
  imports: [Barchart, Card, FormsModule, Grid, Info, Select, Statcard],
  templateUrl: './branchlist.start.html',
  styleUrl: './branchlist.scss',
})
export class BranchlistStart extends BaseComponent implements OnInit {
  private readonly dashboardService = inject(DashboardControllerService);
  private readonly regionService = inject(RegionControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('BRANCHLIST_TITLE', 'Şube Yoğunluğu'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    chartTitle: this.getResource('BRANCH_WORKLOAD_TITLE', 'şube transfer yoğunluğu'),
    listTitle: this.getResource('BRANCHLIST_LIST', 'Şubeler'),
    totalTransfer: this.getResource('BRANCHLIST_TOTALTRANSFER', 'Toplam transfer'),
    branchCount: this.getResource('BRANCHLIST_BRANCHCOUNT', 'Şube sayısı'),
    empty: this.getResource('EMPTY_BRANCH', 'Şube bulunamadı'),
    carried: this.getResource('BRANCHLIST_CARRIED', 'Panodan taşınan işlem'),
  }));

  readonly columns = computed(() => [
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'totalCustomer', title: this.getResource('GRID_TOTALCUSTOMER', 'Müşteri') },
    { field: 'activeCustomer', title: this.getResource('GRID_ACTIVECUSTOMER', 'Aktif') },
    { field: 'havale', title: this.getResource('GRID_HAVALE', 'Havale') },
    { field: 'eft', title: this.getResource('GRID_EFT', 'EFT') },
    { field: 'fast', title: this.getResource('GRID_FAST', 'FAST') },
    { field: 'swift', title: this.getResource('GRID_SWIFT', 'SWIFT') },
    { field: 'autoPayment', title: this.getResource('GRID_AUTOPAYMENT', 'Oto. Ödeme') },
    { field: 'transferLoad', title: this.getResource('GRID_TRANSFERLOAD', 'Transfer') },
    { field: 'loadPercent', title: this.getResource('GRID_LOADPERCENT', 'Yoğunluk %') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', status: '' };

    this.getCityList();
    this.getBranchWorkload();
  }

  getCityList() {
    this.once('CityList', () => firstValueFrom(this.regionService.regionList({})))
      .then((response) => {
        this.State.CityList = (response?.regions ?? []).map((city) => ({ value: city.id, text: city.name }));
      })
      .catch((error) => console.error('City list:', error));
  }

  getBranchWorkload() {
    firstValueFrom(this.dashboardService.branchWorkload(this.State.Request))
      .then((response) => {
        this.State.BranchWorkload = response;
        this.State.BranchChart = (response?.branches ?? []).map((branch) => ({
          label: branch.branchName ?? '',
          value: branch.transferLoad ?? 0,
        }));
      })
      .catch((error) => console.error('Branch workload:', error));
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;
    this.getBranchWorkload();
  }
}
