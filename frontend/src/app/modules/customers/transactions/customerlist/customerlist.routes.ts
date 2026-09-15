import { Routes } from '@angular/router';
import { CustomerlistConfig } from './customerlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./customerlist.start').then((m) => m.CustomerlistStart),
        data: { config: CustomerlistConfig },
    },
];
