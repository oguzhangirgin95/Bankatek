import { Routes } from '@angular/router';
import { AccountsConfig } from './accounts.config';

export const routes: Routes = [
    {
        path: 'accountlist',
        loadChildren: () => import('./transactions/accountlist/accountlist.routes').then((m) => m.routes),
        data: { moduleConfig: AccountsConfig },
    },
];
