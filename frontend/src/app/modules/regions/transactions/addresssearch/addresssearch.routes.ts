import { Routes } from '@angular/router';
import { AddresssearchConfig } from './addresssearch.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./addresssearch.start').then((m) => m.AddresssearchStart),
        data: { config: AddresssearchConfig },
    },
];
