import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'customerlist',
        loadChildren: () => import('./transactions/customerlist/customerlist.routes').then((m) => m.routes),
    },
];
