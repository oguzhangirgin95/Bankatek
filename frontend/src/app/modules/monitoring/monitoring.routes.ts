import { Routes } from '@angular/router';
import { MonitoringConfig } from './monitoring.config';

export const routes: Routes = [
    {
        path: 'dashboard',
        loadChildren: () => import('./transactions/dashboard/dashboard.routes').then((m) => m.routes),
        data: { moduleConfig: MonitoringConfig },
    },
];
