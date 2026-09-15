import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'regionlist',
        loadChildren: () => import('./transactions/regionlist/regionlist.routes').then((m) => m.routes),
    },
];
