import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Layer } from 'src/app/core/services/map-settings.service';
import { MapSelectorService } from './map-selector.service';

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.scss'],
})
export class MapSelectorComponent implements OnInit {

  maps: Layer[];
  selectedMap: Layer;

  constructor(private mapService: MapSelectorService, private menu: MenuController) { }

  async ngOnInit() {
    this.maps = await this.mapService.getAvailableMaps();
    this.selectedMap = await this.mapService.getActiveMap();
  }

  async selectionChange() {
    this.menu.close();
    this.mapService.setActiveMap(this.selectedMap);
  }
}
