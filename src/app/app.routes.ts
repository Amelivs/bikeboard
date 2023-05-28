import { Routes } from '@angular/router';

import { ShellComponent } from './shell/shell.component';


export const appRoutes: Routes = [
  {
    path: '', component: ShellComponent
  },
  {
    path: 'app', loadChildren: () => import('./feature-home/home.routes').then(m => m.homeRoutes)
  }
];
