import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { SeedingGuard } from './core/guards/seeding.guard';
import { HomeComponent } from './features/home/home.component';
import { MapPage } from './features/map/map.page';

const routes: Routes = [
  {
    path: '', canActivate: [SeedingGuard], component: HomeComponent, children: [
      {
        path: '', component: MapPage
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
