import { Routes } from '@angular/router';
import { DashboardConfig } from './dashboard.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./dashboard.start').then((m) => m.DashboardStart),
        data: { config: DashboardConfig },
    },
];
