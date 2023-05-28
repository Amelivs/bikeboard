import { Routes } from '@angular/router';

import { mapRoutes } from '../feature-map/map.routes';
import { seedingGuard } from '../core/guards/seeding.guard';
import { HomeComponent } from './feature/home.component';


export const homeRoutes: Routes = [
  {
    path: '', canActivate: [seedingGuard], component: HomeComponent, children: [
      {
        path: '', loadChildren: () => mapRoutes
      }
    ]
  }
];
