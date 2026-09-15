import { Routes } from '@angular/router';
import { AnalyticsConfig } from './analytics.config';

export const routes: Routes = [
    {
        path: 'transfertrend',
        loadChildren: () => import('./transactions/transfertrend/transfertrend.routes').then((m) => m.routes),
        data: { moduleConfig: AnalyticsConfig },
    },
];
