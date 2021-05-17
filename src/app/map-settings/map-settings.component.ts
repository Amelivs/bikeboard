import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapSettingsService, Layer } from '../services/map-settings.service';

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.scss'],
})
export class MapSettingsComponent implements OnInit {

  private _pathsSelection = new Map<Layer, boolean>();

  constructor(private modalCtrl: ModalController, private mapSettings: MapSettingsService) { }

  async ngOnInit() {
    this.selectedMap = await this.mapSettings.getMap();
    var selectedPaths = await this.mapSettings.getPaths();

    for (var p of this.mapSettings.paths) {
      this._pathsSelection.set(p, selectedPaths.indexOf(p) > -1);
    }
    this.paths = this.mapSettings.paths
  }

  maps = this.mapSettings.maps;
  paths: Layer[];
  selectedMap: Layer;

  isChecked(path: Layer) {
    return this._pathsSelection.get(path);
  }

  checkedChange(path: Layer) {
    var previous = this._pathsSelection.get(path);
    this._pathsSelection.set(path, !previous);
  }

  okClick() {
    this.mapSettings.setMap(this.selectedMap);
    var checkedPaths: Layer[] = [];
    this._pathsSelection.forEach((checked, path) => {
      if (checked) {
        checkedPaths.push(path);
      }
    });
    this.mapSettings.setPaths(checkedPaths);
    this.modalCtrl.dismiss();
  }
}
