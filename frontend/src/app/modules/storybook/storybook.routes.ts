import { Routes } from '@angular/router';
import { StorybookConfig } from './storybook.config';

export const routes: Routes = [
    {
        path: 'pagebuilder',
        loadChildren: () => import('./transactions/pagebuilder/pagebuilder.routes').then((m) => m.routes),
        data: { moduleConfig: StorybookConfig },
    },
    {
        path: 'showcase',
        loadChildren: () => import('./transactions/showcase/showcase.routes').then((m) => m.routes),
        data: { moduleConfig: StorybookConfig },
    },
];
