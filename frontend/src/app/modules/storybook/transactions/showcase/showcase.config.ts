import { FlowConfig, ValidatorEnum } from "../../../../../lib/base/baseconfig/config";

export const ShowcaseConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        showContinueButton: false,
        showBackButton: false,
        validation: [
          {
            id: 'showcaseName',
            value: 'ShowcaseName',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'SHOWCASE_NAME_REQUIRED|Ad alanı zorunludur',
          },
        ],
        tour: [
          {
            id: 'showcaseSidebar',
            title: 'SHOWCASE_TOUR_SIDEBAR_TITLE|Yan menü',
            text: 'SHOWCASE_TOUR_SIDEBAR_TEXT|Hamburger düğmesi menüyü daraltır; ikonlar kalır, yazılar gizlenir.',
            position: 'right',
          },
          {
            id: 'showcaseTicker',
            title: 'SHOWCASE_TOUR_TICKER_TITLE|Haber şeridi',
            text: 'SHOWCASE_TOUR_TICKER_TEXT|Şerit kendiliğinden kayar, fareyle üzerine geldiğinizde durur.',
          },
          {
            id: 'showcaseCards',
            title: 'SHOWCASE_TOUR_CARDS_TITLE|Bileşen örnekleri',
            text: 'SHOWCASE_TOUR_CARDS_TEXT|Her kart bir bileşenin örnek kullanımını gösterir.',
            position: 'top',
          },
        ],
      }
    ],
  }
};
