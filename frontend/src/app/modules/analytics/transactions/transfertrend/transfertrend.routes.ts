import { Routes } from '@angular/router';
import { TransfertrendConfig } from './transfertrend.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./transfertrend.start').then((m) => m.TransfertrendStart),
        data: { config: TransfertrendConfig },
    },
];
