import { Routes } from '@angular/router';

import { MapComponent } from './feature/map.component';
import { LayerService } from './services/layer.service';


export const mapRoutes: Routes = [
  {
    path: '',
    providers: [LayerService],
    component: MapComponent
  }
];
