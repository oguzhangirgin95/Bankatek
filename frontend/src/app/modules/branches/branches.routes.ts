import { Routes } from '@angular/router';
import { BranchesConfig } from './branches.config';

export const routes: Routes = [
    {
        path: 'branchlist',
        loadChildren: () => import('./transactions/branchlist/branchlist.routes').then((m) => m.routes),
        data: { moduleConfig: BranchesConfig },
    },
];
