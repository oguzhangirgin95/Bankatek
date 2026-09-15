import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'accountlist',
        loadChildren: () => import('./transactions/accountlist/accountlist.routes').then((m) => m.routes),
    },
];
