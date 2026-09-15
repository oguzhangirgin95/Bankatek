import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { TourService } from '@lib/base/baseservice/tourservice';
import { WEATHER_BASE_PATH, WeatherService } from '@lib/services/external/weatherservice';
import { Body } from '@lib/commons/body/body';
import { Addnewtransaction } from '@lib/commons/addnewtransaction/addnewtransaction';
import { Avatar } from '@lib/commons/avatar/avatar';
import { Badge } from '@lib/commons/badge/badge';
import { Barchart, ChartItem } from '@lib/commons/barchart/barchart';
import { Button } from '@lib/commons/button/button';
import { Card } from '@lib/commons/card/card';
import { Chart, ChartType } from '@lib/commons/chart/chart';
import { Datepicker } from '@lib/commons/datepicker/datepicker';
import { Detailcard } from '@lib/commons/detailcard/detailcard';
import { DocumentViewConfig, Documentview } from '@lib/commons/documentview/documentview';
import { Donutchart } from '@lib/commons/donutchart/donutchart';
import { Footer } from '@lib/commons/footer/footer';
import { Genericlist, GenericListConfig } from '@lib/commons/genericlist/genericlist';
import { Gif } from '@lib/commons/gif/gif';
import { Grid, GridColumn } from '@lib/commons/grid/grid';
import { Header } from '@lib/commons/header/header';
import { Info } from '@lib/commons/info/info';
import { Input } from '@lib/commons/input/input';
import { List, ListItem } from '@lib/commons/list/list';
import { Map, MapPoint } from '@lib/commons/map/map';
import { Menu } from '@lib/commons/menu/menu';
import { Modal } from '@lib/commons/modal/modal';
import { Pagination } from '@lib/commons/pagination/pagination';
import { Profilemenu, ProfileItem } from '@lib/commons/profilemenu/profilemenu';
import { Progress } from '@lib/commons/progress/progress';
import { Ringprogress } from '@lib/commons/ringprogress/ringprogress';
import { Search, SearchResult } from '@lib/commons/search/search';
import { Select, SelectOption } from '@lib/commons/select/select';
import { Sidebar, SidebarItem } from '@lib/commons/sidebar/sidebar';
import { Sidemodal } from '@lib/commons/sidemodal/sidemodal';
import { Skeleton } from '@lib/commons/skeleton/skeleton';
import { Slider, SliderItem } from '@lib/commons/slider/slider';
import { Spinner } from '@lib/commons/spinner/spinner';
import { Statcard } from '@lib/commons/statcard/statcard';
import { Tabs, TabItem } from '@lib/commons/tabs/tabs';
import { Theme } from '@lib/commons/theme/theme';
import { Ticker, TickerItem } from '@lib/commons/ticker/ticker';
import { Tooltip, TooltipState, TOOLTIP_HIDDEN } from '@lib/commons/tooltip/tooltip';
import { Unity } from '@lib/commons/unity/unity';
import { Validation } from '@lib/commons/validation/validation';

const ANKARA = { latitude: 39.93, longitude: 32.86 };

@Component({
  imports: [
    Addnewtransaction, Avatar, Badge, Barchart, Body, Button, Card, Datepicker, Detailcard,
    Chart, Documentview, Donutchart, Footer, FormsModule, Genericlist, Gif, Grid,
    Header, Info, Input, List, Map, Menu, Modal, Pagination, Profilemenu,
    Progress, Ringprogress, Search, Select, Sidebar, Sidemodal, Skeleton, Slider,
    Spinner, Statcard, Tabs, Theme, Ticker, Tooltip, Unity, Validation,
  ],
  templateUrl: './showcase.start.html',
  styleUrl: './showcase.scss',
})
export class ShowcaseStart extends BaseComponent {
  readonly menu: SidebarItem[] = [
    { text: 'Pano', path: 'dashboard', icon: 'dashboard' },
    { text: 'Transferler', path: 'transfers', icon: 'folder' },
    { text: 'Analiz', path: 'analytics', icon: 'chart' },
    { text: 'Ekip', path: 'team', icon: 'users' },
    { text: 'Hesap', section: true },
    { text: 'Ayarlar', path: 'settings', icon: 'settings' },
    { text: 'Yardım', path: 'help', icon: 'help' },
  ];

  readonly profile: ProfileItem[] = [
    { key: 'dashboard', text: 'Pano', icon: 'dashboard' },
    { key: 'settings', text: 'Hesap ayarları', icon: 'settings' },
    { key: 'help', text: 'Yardım merkezi', icon: 'help' },
  ];

  readonly chart: ChartItem[] = [
    { label: 'Ankara', value: 42 },
    { label: 'İstanbul', value: 35 },
    { label: 'İzmir', value: 23 },
  ];

  readonly details: ListItem[] = [
    { key: 'IBAN', value: 'TR34 0006 0000 0000 0010 01' },
    { key: 'Şube', value: 'Kadıköy Şubesi' },
    { key: 'Durum', value: 'Aktif' },
  ];

  readonly options: SelectOption[] = [
    { value: 'tr', text: 'Türkçe' },
    { value: 'en', text: 'İngilizce' },
  ];

  readonly tabList: TabItem[] = [
    { id: 'one', title: 'Genel' },
    { id: 'two', title: 'Detay' },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', title: 'Şehir' },
    { field: 'count', title: 'Transfer' },
  ];

  readonly rows = [
    { name: 'Ankara', count: 42, status: 'Aktif' },
    { name: 'İstanbul', count: 35, status: 'Pasif' },
  ];

  readonly points: MapPoint[] = [
    { id: '06', name: 'Ankara', x: 0, y: 0, value: 42 },
    { id: '34', name: 'İstanbul', x: 0, y: 0, value: 35 },
    { id: '35', name: 'İzmir', x: 0, y: 0, value: 23 },
  ];

  readonly listConfig: GenericListConfig = {
    title: 'Transfer listesi',
    columns: [
      { field: 'name', title: 'Şehir' },
      { field: 'status', title: 'Durum', type: 'badge', variant: (row) => (row.status === 'Aktif' ? 'success' : 'warning') },
    ],
    actions: [{ key: 'show', label: 'Gör', click: (row) => this.pick(row.name) }],
  };

  readonly news: TickerItem[] = [
    { text: 'FAST limiti güncellendi, anlık transfer üst sınırı yükseldi' },
    { text: 'İstanbul Anadolu yakasında yoğunluk normale döndü' },
    { text: 'İzmir bölgesinde yeni kredi kampanyası yürürlükte' },
    { text: 'Sistem bakımı bu gece 02:00 - 03:00 arasında' },
  ];

  readonly cards: SliderItem[] = [
    { title: 'Kadıköy Şubesi', text: 'İstanbul · Aktif · 12 transfer' },
    { title: 'Çankaya Şubesi', text: 'Ankara · Pasif · 8 transfer' },
    { title: 'Alsancak Şubesi', text: 'İzmir · Aktif · 15 transfer' },
    { title: 'Lara Şubesi', text: 'Antalya · Bloke · 3 transfer' },
    { title: 'Nilüfer Şubesi', text: 'Bursa · Aktif · 9 transfer' },
  ];

  readonly documentConfig: DocumentViewConfig = {
    title: 'Şehir transfer raporu',
    fileName: 'sehir-transfer-raporu',
    description: 'Seçili dönemdeki şehir bazlı transfer sayıları',
    columns: [
      { field: 'name', title: 'Şehir' },
      { field: 'count', title: 'Transfer' },
      { field: 'status', title: 'Durum' },
    ],
  };

  private readonly tourService = inject(TourService);

  private readonly weatherService = inject(WeatherService);

  readonly active = signal('dashboard');
  readonly tab = signal('one');
  readonly page = signal(1);
  readonly modalOpen = signal(false);
  readonly sideOpen = signal(false);
  readonly slide = signal(0);
  readonly tooltip = signal<TooltipState>(TOOLTIP_HIDDEN);
  readonly message = signal('');

  readonly form = { name: '', language: 'tr', date: '' };

  readonly weatherOrigin = WEATHER_BASE_PATH;

  readonly chartTypes: ChartType[] = ['bar', 'column', 'line', 'area', 'pie', 'donut', 'stacked'];

  readonly cities: SearchResult[] = [
    { key: '06', text: 'Ankara', hint: '42 transfer' },
    { key: '34', text: 'İstanbul', hint: '35 transfer' },
    { key: '35', text: 'İzmir', hint: '23 transfer' },
  ];

  readonly hits = signal<SearchResult[]>([]);

  readonly weather = signal('');

  search(text: string): void {
    const query = text.trim().toLocaleLowerCase('tr');

    this.hits.set(query ? this.cities.filter((city) => city.text.toLocaleLowerCase('tr').includes(query)) : []);
  }

  loadWeather(): void {
    this.weather.set('');

    firstValueFrom(this.weatherService.current(ANKARA.latitude, ANKARA.longitude))
      .then((current) => this.weather.set(`Ankara: ${current.temperature} °C`))
      .catch(() => this.weather.set(''));
  }

  goPagebuilder(): void {
    this.navigate('storybook/pagebuilder');
  }

  startTour(): void {
    this.tourService.enable();
  }

  validate(): void {
    this.validateCurrentStep();
  }

  pick(value: string): void {
    this.message.set(value + ' seçildi');
  }

  showTooltip(event: MouseEvent, text: string): void {
    this.tooltip.set({ text, x: event.clientX, y: event.clientY });
  }

  hideTooltip(): void {
    this.tooltip.set(TOOLTIP_HIDDEN);
  }
}
