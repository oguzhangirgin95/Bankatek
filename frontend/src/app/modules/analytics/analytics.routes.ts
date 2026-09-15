import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'transfertrend',
        loadChildren: () => import('./transactions/transfertrend/transfertrend.routes').then((m) => m.routes),
    },
];
