import { Routes } from '@angular/router';
import { PagebuilderConfig } from './pagebuilder.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./pagebuilder.start').then((m) => m.PagebuilderStart),
        data: { config: PagebuilderConfig },
    },
];
