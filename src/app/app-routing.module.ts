import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SeedingGuard } from './core/guards/seeding.guard';
import { HomeComponent } from './feature-home/feature/home.component';
import { MapModule } from './feature-map/map.module';


const routes: Routes = [
  {
    path: '', canActivate: [SeedingGuard], component: HomeComponent, children: [
      {
        path: '', loadChildren: () => MapModule
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
