import { FlowConfig, ValidatorEnum } from "../../../../../lib/base/baseconfig/config";
import { ReportEntryControllerService } from "../../../../../lib/services/api/reportEntryController.service";

export const ReportEntryConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
        title: 'REPORTENTRY_STEP_SCOPE | Kapsam',
        showContinueButton: true,
        showBackButton: false,
        validation: [
          {
            id: 'reportName',
            value: 'State.Request.reportName',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'VALIDATION_REQUIRED | Rapor adı girilmeli'
          },
          {
            id: 'reportType',
            value: 'State.Request.reportType',
            validatorType: ValidatorEnum.Required,
            validationMessage: 'VALIDATION_REQUIRED | Rapor tipi seçilmeli'
          },
        ],
      },
      {
        step: 'confirm',
        title: 'REPORTENTRY_STEP_CONFIRM | Onay',
        showContinueButton: true,
        showBackButton: true,
        validation: [],
        service: {
          serviceName: ReportEntryControllerService,
          methodName: 'confirm',
          params: ['Request']
        }
      },
      {
        step: 'execute',
        title: 'REPORTENTRY_STEP_RESULT | Sonuç',
        showContinueButton: false,
        showBackButton: false,
        validation: [],
        keepState: true,
        service: {
          serviceName: ReportEntryControllerService,
          methodName: 'execute',
          params: ['Request']
        }
      },
    ],
  }
};
