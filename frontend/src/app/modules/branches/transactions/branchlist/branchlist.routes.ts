import { Routes } from '@angular/router';
import { BranchlistConfig } from './branchlist.config';

export const routes: Routes = [
    {
        path: 'start',
        loadComponent: () => import('./branchlist.start').then((m) => m.BranchlistStart),
        data: { config: BranchlistConfig },
    },
];
