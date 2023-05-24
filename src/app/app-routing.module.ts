import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './feature-home/feature/home.component';
import { MapModule } from './feature-map/map.module';
import { seedingGuard } from './core/guards/seeding.guard';


const routes: Routes = [
  {
    path: '', canActivate: [seedingGuard], component: HomeComponent, children: [
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
