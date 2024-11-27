import { Routes } from '@angular/router';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';

import { ShellComponent } from './shell/shell.component';

addIcons({ ...icons });

export const appRoutes: Routes = [
  {
    path: '', component: ShellComponent
  },
  {
    path: 'app', loadChildren: () => import('./feature-home/home.routes').then(m => m.homeRoutes)
  }
];
