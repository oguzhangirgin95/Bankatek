import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'reportlist',
        loadChildren: () => import('./transactions/reportlist/reportlist.routes').then((m) => m.routes),
    },
    {
        path: 'reportentry',
        loadChildren: () => import('./transactions/reportentry/reportentry.routes').then((m) => m.routes),
    },
];
