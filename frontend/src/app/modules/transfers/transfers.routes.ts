import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'transferlist',
        loadChildren: () => import('./transactions/transferlist/transferlist.routes').then((m) => m.routes),
    },
    {
        path: 'transfercreate',
        loadChildren: () => import('./transactions/transfercreate/transfercreate.routes').then((m) => m.routes),
    },
];
