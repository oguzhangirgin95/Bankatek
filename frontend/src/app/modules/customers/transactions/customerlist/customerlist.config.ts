import { FlowConfig } from "../../../../../lib/base/baseconfig/config";

export const CustomerlistConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        tour: [
          {
            id: 'cityId',
            title: 'TOUR_CUSTOMERLIST_CITY_TITLE|Önce portföyü daraltın',
            text: 'TOUR_CUSTOMERLIST_CITY_TEXT|Şehir seçtiğinizde şube listesi de o şehre iner; 276 müşteri arasında tek tek gezmek yerine şubesinden ilerleyebilirsiniz.',
          },
          {
            id: 'searchText',
            title: 'TOUR_CUSTOMERLIST_SEARCH_TITLE|Ad ya da müşteri numarası',
            text: 'TOUR_CUSTOMERLIST_SEARCH_TEXT|Arama, filtrelerin üstüne biner: seçili şehir ve şubenin içinde arar, tamamında değil.',
          },
          {
            id: 'status',
            title: 'TOUR_CUSTOMERLIST_STATUS_TITLE|Durum riski gösterir',
            text: 'TOUR_CUSTOMERLIST_STATUS_TEXT|Bloke ve takipteki müşteriler transfer akışında uyarı üretir; listeyi duruma göre süzerek bunları önden görebilirsiniz.',
          },
        ],
        showContinueButton: false,
        showBackButton: false,
        validation: [],
      }
    ],
  }
};
