import { FlowConfig } from "../../../../../lib/base/baseconfig/config";

export const DashboardConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        validation: [],
        showMenu: true,
        tour: [
          {
            id: 'cityId',
            title: 'TOUR_DASHBOARD_CITY_TITLE|Önce kapsamı daraltın',
            text: 'TOUR_DASHBOARD_CITY_TEXT|Şehir, şube ve durum seçtiğinizde alttaki bütün sayılar, harita ve tablolar aynı anda bu seçime göre yenilenir.',
          },
          {
            id: 'dashboardStats',
            title: 'TOUR_DASHBOARD_STATS_TITLE|Kartlara tıklayın',
            text: 'TOUR_DASHBOARD_STATS_TEXT|Özet kartları aynı zamanda birer kısayoldur. Bir karta tıkladığınızda harita o duruma göre renklenir; aynı karta tekrar tıklamak seçimi kaldırır.',
          },
          {
            id: 'dashboardMap',
            title: 'TOUR_DASHBOARD_MAP_TITLE|Haritadan şehir seçin',
            text: 'TOUR_DASHBOARD_MAP_TEXT|Haritadaki bir şehre tıklamak, şehir filtresini doldurmakla aynı işi görür. En yoğun şehir başlığın yanında yazar.',
            position: 'right',
          },
          {
            id: 'dashboardBranches',
            title: 'TOUR_DASHBOARD_BRANCHES_TITLE|Şube yoğunluğu',
            text: 'TOUR_DASHBOARD_BRANCHES_TEXT|Seçili şehirdeki şubelerin transfer yükünü buradan karşılaştırabilir, tabloyu yatay kaydırarak bütün sütunları görebilirsiniz.',
            position: 'top',
          },
        ],
      }
    ],
  }
};
