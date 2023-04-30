import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { MapComponent } from './feature/map.component';
import { SharedUiModule } from '../shared/ui/ui.module';
import { ActivitiesModule } from '../feature-activities/activities.module';
import { MapRoutingModule } from './map-routing.module';
import { MapViewerComponent } from './ui/map-viewer/map-viewer.component';
import { LayerService } from './services/layer.service';


@NgModule({
  declarations: [
    MapViewerComponent,
    MapComponent
  ],
  imports: [
    MapRoutingModule,
    CommonModule,
    IonicModule,
    SharedUiModule,
    ActivitiesModule
  ],
  providers: [LayerService]
})
export class MapModule { }
