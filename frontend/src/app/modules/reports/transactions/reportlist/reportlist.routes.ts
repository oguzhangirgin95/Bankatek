import { Routes } from '@angular/router';
import { ReportlistConfig } from './reportlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./reportlist.start').then((m) => m.ReportlistStart),
        data: { config: ReportlistConfig },
    },
];
