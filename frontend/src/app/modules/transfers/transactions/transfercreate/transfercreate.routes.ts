import { Routes } from '@angular/router';
import { TransfercreateConfig } from './transfercreate.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./transfercreate.start').then((m) => m.TransfercreateStart),
        data: { config: TransfercreateConfig },
    },
    {
        path: 'confirm',
        loadComponent: () =>
            import('../../../../../lib/base/basecomponent/commonconfirm/commonconfirm').then((m) => m.Commonconfirm),
        data: { config: TransfercreateConfig },
    },
    {
        path: 'execute',
        loadComponent: () =>
            import('../../../../../lib/base/basecomponent/commonexecute/commonexecute').then((m) => m.Commonexecute),
        data: { config: TransfercreateConfig },
    },
];
