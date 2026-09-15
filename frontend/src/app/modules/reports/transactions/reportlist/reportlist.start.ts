import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { ReportEntryControllerService } from '@lib/services/api/reportEntryController.service';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Grid } from '@lib/commons/grid/grid';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';

@Component({
  imports: [Button, Card, FormsModule, Grid, Select, Statcard],
  templateUrl: './reportlist.start.html',
  styleUrl: './reportlist.scss',
})
export class ReportlistStart extends BaseComponent implements OnInit {
  private readonly reportService = inject(ReportEntryControllerService);
  private readonly router = inject(Router);

  readonly labels = computed(() => ({
    title: this.getResource('REPORTLIST_TITLE', 'Oluşturulan Raporlar'),
    type: this.getResource('REPORTENTRY_TYPE', 'Rapor tipi'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    listTitle: this.getResource('REPORTLIST_LIST', 'Raporlar'),
    total: this.getResource('REPORTLIST_TOTAL', 'Rapor sayısı'),
    empty: this.getResource('REPORTLIST_EMPTY', 'Henüz rapor oluşturulmadı'),
    newReport: this.getResource('REPORTLIST_NEW', 'Yeni rapor'),
  }));

  readonly columns = computed(() => [
    { field: 'reportNo', title: this.getResource('GRID_REPORTNO', 'Rapor No') },
    { field: 'reportName', title: this.getResource('GRID_REPORTNAME', 'Rapor adı') },
    { field: 'reportTypeName', title: this.getResource('REPORTENTRY_TYPE', 'Rapor tipi') },
    { field: 'cityName', title: this.getResource('GRID_CITY', 'Şehir') },
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'period', title: this.getResource('GRID_PERIOD', 'Dönem') },
    { field: 'customerCount', title: this.getResource('GRID_TOTALCUSTOMER', 'Müşteri') },
    { field: 'transferCount', title: this.getResource('GRID_TRANSFERCOUNT', 'Transfer') },
    { field: 'createdDate', title: this.getResource('GRID_CREATEDDATE', 'Tarih') },
  ]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { reportType: '', cityId: '' };

    this.getTypeList();
    this.getReportList();
  }

  getTypeList() {
    firstValueFrom(this.reportService.reportTypeList({}))
      .then((response) => {
        this.State.TypeList = (response?.types ?? []).map((type) => ({ value: type.key, text: type.name }));
      })
      .catch((error) => console.error('Report types:', error));
  }

  getReportList() {
    firstValueFrom(this.reportService.reportList(this.State.Request))
      .then((response) => {
        this.State.ReportList = response?.reports ?? [];
        this.State.TotalCount = response?.totalCount ?? 0;
      })
      .catch((error) => console.error('Report list:', error));
  }

  setFilter(key: string, value: string) {
    this.State.Request[key] = value;
    this.getReportList();
  }

  newReport() {
    this.router.navigateByUrl('/reports/reportentry/start');
  }
}
