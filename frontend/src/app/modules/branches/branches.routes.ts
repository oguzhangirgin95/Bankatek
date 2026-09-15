import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'branchlist',
        loadChildren: () => import('./transactions/branchlist/branchlist.routes').then((m) => m.routes),
    },
];
