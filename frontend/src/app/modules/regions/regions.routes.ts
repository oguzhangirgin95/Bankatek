import { Routes } from '@angular/router';
import { RegionsConfig } from './regions.config';

export const routes: Routes = [
    {
        path: 'regionlist',
        loadChildren: () => import('./transactions/regionlist/regionlist.routes').then((m) => m.routes),
        data: { moduleConfig: RegionsConfig },
    },
];
