import { FlowConfig, ValidatorEnum } from "../../../../../lib/base/baseconfig/config";
import { ReportEntryControllerService } from "../../../../../lib/services/api/reportEntryController.service";

export const ReportEntryConfig: FlowConfig = {
  config: {
    steps: [
      {
        step: 'start',
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
