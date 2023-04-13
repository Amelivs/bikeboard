import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';

import { ImportMapComponent } from './feature/import-map/import-map.component';
import { ImportPathComponent } from './feature/import-path/import-path.component';


@NgModule({
  declarations: [
    ImportMapComponent,
    ImportPathComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ]
})
export class ImportModule { }
