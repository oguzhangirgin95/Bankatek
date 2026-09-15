import { Routes } from '@angular/router';
import { AccountlistConfig } from './accountlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./accountlist.start').then((m) => m.AccountlistStart),
        data: { config: AccountlistConfig },
    },
];
