import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, EMPTY, firstValueFrom, interval, switchMap } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { DashboardControllerService } from '@lib/services/api/dashboardController.service';
import { CustomerControllerService } from '@lib/services/api/customerController.service';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { SettingControllerService } from '@lib/services/api/settingController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { Barchart } from '@lib/commons/barchart/barchart';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Datepicker } from '@lib/commons/datepicker/datepicker';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { DocumentViewConfig, Documentview } from '@lib/commons/documentview/documentview';
import { GenericListConfig, Genericlist } from '@lib/commons/genericlist/genericlist';
import { Gif } from '@lib/commons/gif/gif';
import { InfoVariant } from '@lib/commons/info/info';
import { Select } from '@lib/commons/select/select';
import { Statcard } from '@lib/commons/statcard/statcard';
import { Unity } from '@lib/commons/unity/unity';

const STATUS_VARIANT: Record<string, string> = {
  AKTIF: 'success',
  PASIF: 'teal',
  BLOKE: 'warning',
  TAKIPTE: 'violet',
};

@Component({
  imports: [Barchart, Button, Card, Datepicker, Documentview, Donutchart, FormsModule, Genericlist, Gif, Select, Statcard, Unity],
  templateUrl: './dashboard.start.html',
  styleUrl: './dashboard.scss',
})
export class DashboardStart extends BaseComponent implements OnInit {
  private readonly dashboardService = inject(DashboardControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);
  private readonly customerService = inject(CustomerControllerService);
  private readonly settingService = inject(SettingControllerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly labels = computed(() => ({
    title: this.getResource('DASHBOARD_TITLE', 'Bankacılık İzleme Panosu'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    status: this.getResource('FILTER_STATUS', 'Durum'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    dateTime: this.getResource('FILTER_DATETIME', 'Tarih ve saat'),
    totalCustomer: this.getResource('STAT_TOTAL', 'Toplam müşteri'),
    active: this.getResource('STAT_ACTIVE', 'Aktif'),
    passive: this.getResource('STAT_PASSIVE', 'Pasif'),
    blocked: this.getResource('STAT_BLOCKED', 'Bloke'),
    followUp: this.getResource('STAT_FOLLOWUP', 'Takipte'),
    overLimit: this.getResource('STAT_OVERLIMIT', 'Limiti aşan'),
    withinLimit: this.getResource('STAT_WITHINLIMIT', 'Limit içinde'),
    limitChartTitle: this.getResource('LIMIT_CHART_TITLE', 'Transfer limiti'),
    mapHint: this.getResource('MAP_HINT', 'Şehre tıklayarak filtreleyin'),
    busiest: this.getResource('DASHBOARD_BUSIEST', 'En yoğun şehir'),
    statusChartTitle: this.getResource('STATUS_CHART_TITLE', 'Durum dağılımı'),
    branchWorkloadTitle: this.getResource('BRANCH_WORKLOAD_TITLE', 'şube transfer yoğunluğu'),
    emptyBranch: this.getResource('EMPTY_BRANCH', 'Şube bulunamadı'),
    mapTotalTitle: this.getResource('MAP_TOTAL_TITLE', 'Şehir bazlı toplam müşteri'),
    mapTotalActiveTitle: this.getResource('MAP_TOTAL_ACTIVE_TITLE', 'Şehir bazlı aktif müşteri'),
    mapTotalPassiveTitle: this.getResource('MAP_TOTAL_PASSIVE_TITLE', 'Şehir bazlı pasif müşteri'),
    mapTotalBlockedTitle: this.getResource('MAP_TOTAL_BLOCKED_TITLE', 'Şehir bazlı bloke müşteri'),
    mapTotalFollowUpTitle: this.getResource('MAP_TOTAL_FOLLOWUP_TITLE', 'Şehir bazlı takipteki müşteri'),
    mapTotalOverlimitTitle: this.getResource('MAP_TOTAL_OVERLIMIT_TITLE', 'Şehir bazlı limit aşan müşteri'),
    showcase: this.getResource('DASHBOARD_SHOWCASE', 'Bileşenler'),
  }));

  readonly mapTitle = computed(() => {
    const labels = this.labels() as Record<string, string>;
    const key = this.State.MapMetric?.titleKey ?? '';

    return labels[key] ?? labels['mapTotalTitle'];
  });

  /**
   * Şube tablosunun genericlist yapılandırması.
   *
   * Sütunlar ve satır sonundaki butonlar burada tanımlanır; bileşen yalnızca
   * bunu çizer. Başka bir ekran aynı bileşeni kendi config'i ile kullanır.
   */
  /** Şube verisinin sütunları. Hem liste hem belge aynı tanımı kullanır. */
  private readonly branchColumns = computed(() => [
    { field: 'branchName', title: this.getResource('GRID_BRANCH', 'Şube') },
    { field: 'totalCustomer', title: this.getResource('GRID_TOTALCUSTOMER', 'Müşteri') },
    { field: 'activeCustomer', title: this.getResource('GRID_ACTIVECUSTOMER', 'Aktif') },
    { field: 'havale', title: this.getResource('GRID_HAVALE', 'Havale') },
    { field: 'eft', title: this.getResource('GRID_EFT', 'EFT') },
    { field: 'fast', title: this.getResource('GRID_FAST', 'FAST') },
    { field: 'transferLoad', title: this.getResource('GRID_TRANSFERLOAD', 'Transfer') },
  ]);

  readonly branchListConfig = computed<GenericListConfig>(() => {
    const view = this.getResource('ACTION_VIEW', 'Görüntüle');
    const edit = this.getResource('ACTION_EDIT', 'Düzenle');
    const download = this.getResource('ACTION_EXPORT', 'Dışa aktar');
    const archive = this.getResource('ACTION_ARCHIVE', 'Arşivle');

    return {
      columns: [
        {
          field: 'loadPercent',
          title: this.getResource('GRID_STATUS', 'Durum'),
          type: 'badge',
          format: (branch) => this.getLoadLabel(branch.loadPercent ?? 0),
          variant: (branch) => this.getLoadVariant(branch.loadPercent ?? 0),
        },
        ...this.branchColumns(),
      ],
      actions: [
        { key: 'view', label: view, click: (branch) => this.viewBranch(branch) },
        { key: 'edit', label: edit, click: (branch) => this.editBranch(branch) },
        { key: 'export', label: download, variant: 'secondary', click: (branch) => this.exportBranch(branch) },
        {
          key: 'archive',
          label: archive,
          variant: 'secondary',
          visible: (branch) => (branch.loadPercent ?? 0) < 80,
          click: (branch) => this.archiveBranch(branch),
        },
      ],
      emptyText: this.labels().emptyBranch,
    };
  });

  /**
   * Şube tablosunun belge yapılandırması.
   *
   * Aynı satırlar CSV ve PDF çıktısına da girsin diye sütunlar listeyle
   * paylaşılıyor; durum sütunu belgeye alınmıyor.
   */
  readonly branchDocumentConfig = computed<DocumentViewConfig>(() => ({
    title: `${this.State.BranchWorkload?.cityName ?? ''} ${this.labels().branchWorkloadTitle}`,
    fileName: this.getResource('DOCUMENT_FILENAME', 'sube-transfer-yogunlugu'),
    description: this.getResource('DOCUMENT_DESCRIPTION', 'Seçili filtrelere göre hazırlanmıştır.'),
    columns: this.branchColumns(),
    emptyText: this.labels().emptyBranch,
  }));

  /** Son tıklanan işlem; örneğin çalıştığını göstermek için kartın altında yazar. */
  readonly branchActionText = computed(() => {
    const action = this.State.BranchAction;

    return action ? `${action.label}: ${action.branchName}` : '';
  });

  constructor() {
    super();
  }

  ngOnInit() {
    this.State.Request = { cityId: '', branchId: '', status: '' };

    this.getCityList();
    this.getBranchList();
    this.getStatusList();
    this.getDashboard();
    this.getAutoRefresh();
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


  getDashboard() {
    this.getSummary();
    this.getMapStatistics();
    this.getBranchWorkload();
  }

  getSummary() {
    firstValueFrom(this.dashboardService.dashboardSummary(this.State.Request))
      .then((response) => {
        this.State.Summary = response;
        this.State.StatusChart = (response?.statusDistribution ?? []).map((item) => ({
          label: item.name ?? '',
          value: item.count ?? 0,
          color: `var(--color-${STATUS_VARIANT[item.key ?? ''] ?? 'info'})`,
        }));

        const total = response?.totalCustomer ?? 0;
        const overLimit = response?.overDailyLimit ?? 0;

        this.State.LimitChart = [
          { label: this.labels().overLimit, value: overLimit, color: 'var(--color-error)' },
          { label: this.labels().withinLimit, value: Math.max(0, total - overLimit), color: 'var(--color-success)' },
        ];
      })
      .catch((error) => console.error('Summary:', error));
  }

  getMapStatistics() {
    const metric = this.State.MapMetric;
    const request = metric ? { ...this.State.Request, status: metric.status } : this.State.Request;

    firstValueFrom(this.dashboardService.mapStatistics(request))
      .then((response) => {
        this.State.MapStatistics = response;
        this.State.MapPoints = (response?.cities ?? []).map((city) => ({
          id: city.cityId ?? '',
          name: city.cityName ?? '',
          x: city.x ?? 0,
          y: city.y ?? 0,
          value: (metric ? city[metric.field as keyof typeof city] : city.totalCustomer) ?? 0,
        }));
      })
      .catch((error) => console.error('Map:', error));
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

  getAutoRefresh() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.settingService
      .settingGet({ token: this.flowService.token() })
      .pipe(
        catchError(() => EMPTY),
        switchMap((response) => {
          const seconds = response?.refreshSeconds ?? 0;
          return seconds > 0 ? interval(seconds * 1000) : EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.getDashboard());
  }


  setFilter(key: string, value: string) {
    this.State.Request[key] = value;

    if (key === 'cityId') {
      this.State.Request.branchId = '';
      this.getBranchList();
    }

    if (key === 'status') {
      this.State.MapMetric = undefined;
    }

    this.getDashboard();
  }

  /** Transfer yüküne göre etiket rengi. */
  getLoadVariant(percent: number): InfoVariant {
    if (percent >= 80) {
      return 'error';
    }

    return percent >= 50 ? 'warning' : 'success';
  }

  /** Transfer yüküne göre etiket metni. */
  getLoadLabel(percent: number): string {
    if (percent >= 80) {
      return this.getResource('LOAD_HIGH', 'Yoğun');
    }

    return percent >= 50 ? this.getResource('LOAD_NORMAL', 'Normal') : this.getResource('LOAD_LOW', 'Düşük');
  }

  /** Seçilen şubei filtreye taşır. */
  viewBranch(branch: any) {
    this.setBranchAction(this.getResource('ACTION_VIEW', 'Görüntüle'), branch);
    this.setFilter('branchId', branch.branchId ?? '');
  }

  /** Bileşen örneklerinin bulunduğu storybook ekranına gider. */
  goShowcase() {
    this.router.navigateByUrl('/storybook/showcase/start');
  }

  /**
   * Şube düzenleme ekranına gider.
   *
   * İkinci parametre true: seçilen şube State'te durduğu için hedef ekrana
   * taşınması gerekiyor, yoksa transaction değişiminde silinirdi.
   */
  editBranch(branch: any) {
    this.setBranchAction(this.getResource('ACTION_EDIT', 'Düzenle'), branch);
    this.navigate('branches/branchlist', true);
  }

  /** Satırı CSV olarak indirir. */
  exportBranch(branch: any) {
    this.setBranchAction(this.getResource('ACTION_EXPORT', 'Dışa aktar'), branch);

    const csv = `${Object.keys(branch).join(';')}
${Object.values(branch).join(';')}`;
    const link = document.createElement('a');

    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `${branch.branchName ?? 'şube'}.csv`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  /** Şubei arşivler. Gerçek ekranda burada arşivleme servisi çağrılır. */
  archiveBranch(branch: any) {
    this.setBranchAction(this.getResource('ACTION_ARCHIVE', 'Arşivle'), branch);
  }

  /** Yapılan son işlemi kartın üstünde göstermek için saklar. */
  setBranchAction(label: string, branch: any) {
    this.State.BranchAction = { label, branchName: branch.branchName ?? '' };
  }

  selectMetric(metric: { titleKey: string; status?: string; field?: string; variant?: string }) {
    this.State.MapMetric =
      this.State.MapMetric?.titleKey === metric.titleKey
        ? undefined
        : { status: '', field: 'totalCustomer', variant: '', ...metric };

    this.getMapStatistics();
  }
}
