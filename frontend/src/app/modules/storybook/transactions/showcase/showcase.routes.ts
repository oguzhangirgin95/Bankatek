import { Routes } from '@angular/router';
import { ShowcaseConfig } from './showcase.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./showcase.start').then((m) => m.ShowcaseStart),
        data: { config: ShowcaseConfig },
    },
];
