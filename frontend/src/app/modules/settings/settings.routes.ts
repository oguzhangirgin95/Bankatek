import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'preferences',
        loadChildren: () => import('./transactions/preferences/preferences.routes').then((m) => m.routes),
    },
];
