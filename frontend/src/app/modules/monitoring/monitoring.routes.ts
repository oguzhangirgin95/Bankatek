import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'dashboard',
        loadChildren: () => import('./transactions/dashboard/dashboard.routes').then((m) => m.routes),
    },
];
