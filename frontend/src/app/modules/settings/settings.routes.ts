import { Routes } from '@angular/router';
import { SettingsConfig } from './settings.config';

export const routes: Routes = [
    {
        path: 'preferences',
        loadChildren: () => import('./transactions/preferences/preferences.routes').then((m) => m.routes),
        data: { moduleConfig: SettingsConfig },
    },
];
