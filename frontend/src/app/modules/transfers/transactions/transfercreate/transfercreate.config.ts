import { FlowConfig, ValidatorEnum } from "../../../../../lib/base/baseconfig/config";
import { TransferControllerService } from "../../../../../lib/services/api/transferController.service";

export const TransfercreateConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        title: 'TRANSFERCREATE_STEP_FORM | Bilgiler',
        showContinueButton: true,
        showBackButton: false,
        tour: [
          {
            id: 'customerId',
            title: 'TOUR_TRANSFERCREATE_CUSTOMER_TITLE|Gönderen müşteriyi seçin',
            text: 'TOUR_TRANSFERCREATE_CUSTOMER_TEXT|Üstteki şehir ve şube seçimi bu listeyi daraltır; kalabalık portföyde müşteriyi aramak yerine şubesinden bulabilirsiniz.',
          },
          {
            id: 'type',
            title: 'TOUR_TRANSFERCREATE_TYPE_TITLE|Tipi tutara göre seçin',
            text: 'TOUR_TRANSFERCREATE_TYPE_TEXT|FAST anlık ama üst sınırı vardır, EFT gün içinde kapanır, SWIFT yurt dışına gider. Seçim ücreti ve süreyi belirler.',
          },
          {
            id: 'receiverIban',
            title: 'TOUR_TRANSFERCREATE_IBAN_TITLE|IBAN doğrulanır',
            text: 'TOUR_TRANSFERCREATE_IBAN_TEXT|TR ile başlayan 26 karakter beklenir. Eksik girilirse devam ederken uyarı alırsınız, onay ekranına geçilmez.',
          },
          {
            id: 'amount',
            title: 'TOUR_TRANSFERCREATE_AMOUNT_TITLE|Limit onay adımında denetlenir',
            text: 'TOUR_TRANSFERCREATE_AMOUNT_TEXT|Tutarı yazıp devam edin; müşterinin günlük limiti aşılıyorsa bunu onay ekranında görür, işlemi oradan geri çevirebilirsiniz.',
          },
        ],
        validation: [
          {
            id: 'customerId',
            value: 'State.Request.customerId',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'VALIDATION_REQUIRED | Gönderen müşteri seçilmeli'
          },
          {
            id: 'type',
            value: 'State.Request.type',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'VALIDATION_REQUIRED | Transfer tipi seçilmeli'
          },
          {
            id: 'receiverName',
            value: 'State.Request.receiverName',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'VALIDATION_REQUIRED | Alıcı adı girilmeli'
          },
          {
            id: 'receiverIban',
            value: 'State.Request.receiverIban',
            validatorType: ValidatorEnum.Regex,
            regex: '^TR[0-9]{24}$',
            validationMessage: 'VALIDATION_IBAN | Alıcı IBAN TR ile başlamalı ve 26 karakter olmalı'
          },
          {
            id: 'amount',
            value: 'State.Request.amount',
            validatorType: ValidatorEnum.Number,
            validationMessage: 'VALIDATION_AMOUNT | Tutar sayı olmalı'
          }
        ],
      },
      {
        step: 'confirm',
        title: 'TRANSFERCREATE_STEP_CONFIRM | Onay',
        showContinueButton: true,
        showBackButton: true,
        validation: [],
        service: {
          serviceName: TransferControllerService,
          methodName: 'transferCreateConfirm',
          params: ['Request']
        }
      },
      {
        step: 'execute',
        title: 'TRANSFERCREATE_STEP_RESULT | Sonuç',
        showContinueButton: false,
        showBackButton: false,
        validation: [],
        keepState: true,
        service: {
          serviceName: TransferControllerService,
          methodName: 'transferCreateExecute',
          params: ['Request']
        }
      },
    ],
  }
};
