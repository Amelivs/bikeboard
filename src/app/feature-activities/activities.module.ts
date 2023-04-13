import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ActivitiesComponent } from './feature/activities.component';
import { SharedUiModule } from '../shared/ui/ui.module';


@NgModule({
  declarations: [
    ActivitiesComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    SharedUiModule
  ]
})
export class ActivitiesModule { }
