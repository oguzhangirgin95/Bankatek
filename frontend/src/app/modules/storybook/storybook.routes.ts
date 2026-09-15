import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'pagebuilder',
        loadChildren: () => import('./transactions/pagebuilder/pagebuilder.routes').then((m) => m.routes),
    },
    {
        path: 'showcase',
        loadChildren: () => import('./transactions/showcase/showcase.routes').then((m) => m.routes),
    },
];
