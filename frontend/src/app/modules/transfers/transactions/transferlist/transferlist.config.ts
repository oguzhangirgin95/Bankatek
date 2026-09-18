import { FlowConfig } from "../../../../../lib/base/baseconfig/config";

export const TransferlistConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        tour: [
          {
            id: 'type',
            title: 'TOUR_TRANSFERLIST_TYPE_TITLE|Tipe göre süzün',
            text: 'TOUR_TRANSFERLIST_TYPE_TEXT|Havale şube içi, EFT bankalar arası, SWIFT yurt dışıdır. Tip seçimi listeyi ve alttaki toplamları birlikte değiştirir.',
          },
          {
            id: 'status',
            title: 'TOUR_TRANSFERLIST_STATUS_TITLE|Bekleyen işlemler',
            text: 'TOUR_TRANSFERLIST_STATUS_TEXT|Beklemede olanlar henüz kapanmamış işlemlerdir; gün sonunda önce bunları gözden geçirmek gerekir.',
          },
          {
            id: 'onlyOverLimit',
            title: 'TOUR_TRANSFERLIST_LIMIT_TITLE|Limit aşanları ayırın',
            text: 'TOUR_TRANSFERLIST_LIMIT_TEXT|Bu kutu, günlük transfer limitini aşmış müşterilerin işlemlerini tek başına listeler; bildirimlerdeki limit uyarısı da buraya bakar.',
          },
        ],
        showContinueButton: false,
        showBackButton: false,
        validation: [],
      }
    ],
  }
};
