import { Component, OnInit, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { DashboardControllerService } from '@lib/services/api/dashboardController.service';
import { Card } from '@lib/commons/card/card';
import { Grid } from '@lib/commons/grid/grid';
import { Map } from '@lib/commons/map/map';
import { Statcard } from '@lib/commons/statcard/statcard';

@Component({
  imports: [Card, Grid, Map, Statcard],
  templateUrl: './regionlist.start.html',
  styleUrl: './regionlist.scss',
})
export class RegionlistStart extends BaseComponent implements OnInit {
  private readonly dashboardService = inject(DashboardControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('REGIONLIST_TITLE', 'Şehir Bazlı Dağılım'),
    mapTitle: this.getResource('MAP_TOTAL_TITLE', 'Şehir bazlı toplam müşteri'),
    listTitle: this.getResource('REGIONLIST_LIST', 'Şehirler'),
    listHint: this.getResource('REGIONLIST_HINT', 'Haritada seçmek için satıra tıklayın'),
    totalCustomer: this.getResource('STAT_TOTAL', 'Toplam müşteri'),
    activeCustomer: this.getResource('STAT_ACTIVE', 'Aktif'),
    busiest: this.getResource('REGIONLIST_BUSIEST', 'En yoğun şehir'),
    empty: this.getResource('REGIONLIST_EMPTY', 'Şehir bulunamadı'),
  }));

  readonly columns = computed(() => [
    { field: 'cityCode', title: this.getResource('GRID_CITYCODE', 'Şehir kodu') },
    { field: 'cityName', title: this.getResource('GRID_CITY', 'Şehir') },
    { field: 'totalCustomer', title: this.getResource('GRID_TOTALCUSTOMER', 'Müşteri') },
    { field: 'activeCustomer', title: this.getResource('GRID_ACTIVECUSTOMER', 'Aktif') },
    { field: 'activePercent', title: this.getResource('GRID_ACTIVEPERCENT', 'Aktiflik %') },
    { field: 'branchCount', title: this.getResource('GRID_BRANCHCOUNT', 'Şube') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', status: '' };

    this.getMapStatistics();
  }

  getMapStatistics() {
    firstValueFrom(this.dashboardService.mapStatistics(this.State.Request))
      .then((response) => {
        this.State.MapStatistics = response;
        this.State.MapPoints = (response?.cities ?? []).map((city) => ({
          id: city.cityId ?? '',
          name: city.cityName ?? '',
          x: city.x ?? 0,
          y: city.y ?? 0,
          value: city.totalCustomer ?? 0,
        }));
      })
      .catch((error) => console.error('Map:', error));
  }

  selectCity(point: any) {
    this.State.SelectedCityId = point.id;
  }

  selectRow(row: any) {
    this.State.SelectedCityId = row.cityId;
  }
}
