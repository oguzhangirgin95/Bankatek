import { Routes } from '@angular/router';
import { TransfersConfig } from './transfers.config';

export const routes: Routes = [
    {
        path: 'transferlist',
        loadChildren: () => import('./transactions/transferlist/transferlist.routes').then((m) => m.routes),
        data: { moduleConfig: TransfersConfig },
    },
    {
        path: 'transfercreate',
        loadChildren: () => import('./transactions/transfercreate/transfercreate.routes').then((m) => m.routes),
        data: { moduleConfig: TransfersConfig },
    },
];
