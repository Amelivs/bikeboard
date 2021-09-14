import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapSettingsService, Layer, NavigationMode } from '../services/map-settings.service';
import { StorageManagerService } from '../services/storage-manager.service';

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.scss'],
})
export class MapSettingsComponent implements OnInit {

  private _pathsSelection = new Map<Layer, boolean>();
  private readonly _durations = [1, 2, 5, 10, 15];
  private readonly _modes = [
    { label: 'Live orientation', value: NavigationMode.LiveOrientation },
    { label: 'Fixed orientation', value: NavigationMode.FixedOrientation }];

  constructor(private modalCtrl: ModalController, private mapSettings: MapSettingsService, private storageService: StorageManagerService) { }

  async ngOnInit() {
    this.selectedDuration = await this.mapSettings.getTrackingDuration();
    this.selectedMode = await this.mapSettings.getMode();
    let selectedPaths = await this.mapSettings.getPaths();
    this.storageUsage = this.storageService.estimate()
      .then((estimation) => `${estimation.usage} / ${estimation.quota}`);
    this.cacheLength = await this.storageService.getCachedTilesCount();

    for (let p of this.mapSettings.paths) {
      this._pathsSelection.set(p, selectedPaths.indexOf(p) > -1);
    }
    this.paths = this.mapSettings.paths;
  }

  paths: Layer[];
  allDurations = this._durations;
  selectedDuration: number;
  allModes = this._modes;
  selectedMode: NavigationMode;
  storageUsage: Promise<string>;
  cacheLength: number;

  isChecked(path: Layer) {
    return this._pathsSelection.get(path);
  }

  checkedChange(path: Layer) {
    let previous = this._pathsSelection.get(path);
    this._pathsSelection.set(path, !previous);
  }

  okClick() {
    let checkedPaths: Layer[] = [];
    this._pathsSelection.forEach((checked, path) => {
      if (checked) {
        checkedPaths.push(path);
      }
    });
    this.mapSettings.setPaths(checkedPaths);
    this.mapSettings.setTrackingDuration(this.selectedDuration);
    this.mapSettings.setMode(this.selectedMode);
    this.modalCtrl.dismiss();
  }
}
