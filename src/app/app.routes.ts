import { Routes } from '@angular/router';

import { HomeComponent } from './feature-home/feature/home.component';
import { seedingGuard } from './core/guards/seeding.guard';
import { mapRoutes } from './feature-map/map.routes';


export const appRoutes: Routes = [
  {
    path: '', canActivate: [seedingGuard], component: HomeComponent, children: [
      {
        path: '', loadChildren: () => mapRoutes
      }
    ]
  }
];
