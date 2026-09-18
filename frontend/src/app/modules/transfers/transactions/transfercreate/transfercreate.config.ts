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
