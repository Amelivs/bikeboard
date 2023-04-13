import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DebuggingComponent } from './feature/debugging.component';


@NgModule({
  declarations: [
    DebuggingComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class DebuggingModule { }
