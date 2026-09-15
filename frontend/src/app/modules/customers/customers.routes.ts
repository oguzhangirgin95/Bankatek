import { Routes } from '@angular/router';
import { CustomersConfig } from './customers.config';

export const routes: Routes = [
    {
        path: 'customerlist',
        loadChildren: () => import('./transactions/customerlist/customerlist.routes').then((m) => m.routes),
        data: { moduleConfig: CustomersConfig },
    },
];
