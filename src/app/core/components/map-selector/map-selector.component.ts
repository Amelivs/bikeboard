import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Layer, MapSettingsService } from 'src/app/core/services/map-settings.service';

import { MapSelectorService } from './map-selector.service';

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.scss'],
})
export class MapSelectorComponent implements OnInit {

  maps: Layer[];
  selectedMap: Layer;

  paths: Layer[];
  private pathsSelection = new Map<Layer, boolean>();

  constructor(private mapService: MapSelectorService, private menu: MenuController, private mapSettings: MapSettingsService) { }

  async ngOnInit() {
    this.maps = await this.mapService.getAvailableMaps();
    this.selectedMap = await this.mapService.getActiveMap();
    this.mapService.setActiveMap(this.selectedMap);
    let selectedPaths = await this.mapSettings.getPaths();

    for (let p of this.mapSettings.paths) {
      this.pathsSelection.set(p, selectedPaths.indexOf(p) > -1);
    }
    this.paths = this.mapSettings.paths;
    this.mapService.setActivePaths(selectedPaths);
  }

  selectionChange() {
    this.menu.close();
    this.mapService.setActiveMap(this.selectedMap);
  }

  isChecked(path: Layer) {
    return this.pathsSelection.get(path);
  }

  checkedChange(path: Layer) {
    let previous = this.pathsSelection.get(path);
    this.pathsSelection.set(path, !previous);

    let checkedPaths: Layer[] = [];
    this.pathsSelection.forEach((checked, path) => {
      if (checked) {
        checkedPaths.push(path);
      }
    });
    this.mapSettings.setPaths(checkedPaths);
    this.mapService.setActivePaths(checkedPaths);
  }
}
