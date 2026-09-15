import { Routes } from '@angular/router';
import { AuthGuard } from '@lib/base/baseguard/authguard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'monitoring/dashboard/start',
    },
    {
        path: 'analytics',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/analytics/analytics.routes').then((m) => m.routes),
    },
    {
        path: 'monitoring',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/monitoring/monitoring.routes').then((m) => m.routes),
    },
    {
        path: 'transfers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/transfers/transfers.routes').then((m) => m.routes),
    },
    {
        path: 'customers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/customers/customers.routes').then((m) => m.routes),
    },
    {
        path: 'regions',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/regions/regions.routes').then((m) => m.routes),
    },
    {
        path: 'reports',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/reports/reports.routes').then((m) => m.routes),
    },
    {
        path: 'settings',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/settings/settings.routes').then((m) => m.routes),
    },
    {
        path: 'storybook',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/storybook/storybook.routes').then((m) => m.routes),
    },
    {
        path: 'branches',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/branches/branches.routes').then((m) => m.routes),
    },
    {
        path: 'accounts',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/accounts/accounts.routes').then((m) => m.routes),
    },
];
