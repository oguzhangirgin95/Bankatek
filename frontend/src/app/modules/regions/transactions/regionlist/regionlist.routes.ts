import { Routes } from '@angular/router';
import { RegionlistConfig } from './regionlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./regionlist.start').then((m) => m.RegionlistStart),
        data: { config: RegionlistConfig },
    },
];
