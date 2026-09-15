import { Routes } from '@angular/router';
import { PreferencesConfig } from './preferences.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./preferences.start').then((m) => m.PreferencesStart),
        data: { config: PreferencesConfig },
    },
];
