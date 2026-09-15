import { Routes } from '@angular/router';
import { TransferlistConfig } from './transferlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./transferlist.start').then((m) => m.TransferlistStart),
        data: { config: TransferlistConfig },
    },
];
