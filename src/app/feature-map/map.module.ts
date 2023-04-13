import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { MapComponent } from './feature/map.component';
import { SharedUiModule } from '../shared/ui/ui.module';
import { OlMapViewerComponent } from './ui/ol-map-viewer/ol-map-viewer.component';
import { ActivitiesModule } from '../feature-activities/activities.module';
import { MapRoutingModule } from './map-routing.module';


@NgModule({
  declarations: [
    OlMapViewerComponent,
    MapComponent
  ],
  imports: [
    MapRoutingModule,
    CommonModule,
    IonicModule,
    SharedUiModule,
    ActivitiesModule
  ]
})
export class MapModule { }
