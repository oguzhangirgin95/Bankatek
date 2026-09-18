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
        tour: [
          {
            id: 'reportName',
            title: 'TOUR_REPORTENTRY_NAME_TITLE|Rapora tanınır bir ad verin',
            text: 'TOUR_REPORTENTRY_NAME_TEXT|Ad, rapor listesinde aramanın tek dayanağıdır; kapsamı anlatan bir ad sonradan doğru raporu bulmayı kolaylaştırır.',
          },
          {
            id: 'reportType',
            title: 'TOUR_REPORTENTRY_TYPE_TITLE|Tip hangi sütunların geleceğini belirler',
            text: 'TOUR_REPORTENTRY_TYPE_TEXT|Müşteri raporu portföyü, transfer raporu işlem hacmini, limit raporu ise sınırı aşan müşterileri çıkarır.',
          },
          {
            id: 'cityId',
            title: 'TOUR_REPORTENTRY_CITY_TITLE|Kapsamı boş bırakabilirsiniz',
            text: 'TOUR_REPORTENTRY_CITY_TEXT|Şehir ve şube seçilmezse rapor bütün ülkeyi kapsar. Şehri seçince şube listesi yalnızca o şehrin şubelerine iner.',
          },
          {
            id: 'startDate',
            title: 'TOUR_REPORTENTRY_DATE_TITLE|Dönemi daraltın',
            text: 'TOUR_REPORTENTRY_DATE_TEXT|Tarih aralığı raporun kaç müşteri ve kaç transfer kapsadığını değiştirir; kapsam özeti onay adımında sayıyla çıkar.',
          },
        ],
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
