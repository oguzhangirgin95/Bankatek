import { Routes } from '@angular/router';
import { ReportEntryConfig } from './reportentry.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./reportentry.start').then((m) => m.ReportentryStart),
        data: { config: ReportEntryConfig },
    },
    {
        path: 'confirm',
        loadComponent: () =>
            import('../../../../../lib/base/basecomponent/commonconfirm/commonconfirm').then((m) => m.Commonconfirm),
        data: { config: ReportEntryConfig },
    },
    {
        path: 'execute',
        loadComponent: () =>
            import('../../../../../lib/base/basecomponent/commonexecute/commonexecute').then((m) => m.Commonexecute),
        data: { config: ReportEntryConfig },
    },
];
