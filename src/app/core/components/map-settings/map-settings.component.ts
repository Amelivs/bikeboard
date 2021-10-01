import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapSettingsService, Layer } from '../../services/map-settings.service';
import { StorageManagerService } from '../../services/storage-manager.service';

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.scss'],
})
export class MapSettingsComponent implements OnInit {

  private readonly _durations = [1, 2, 5, 10, 15];

  constructor(private modalCtrl: ModalController, private mapSettings: MapSettingsService, private storageService: StorageManagerService) { }

  async ngOnInit() {
    this.selectedDuration = await this.mapSettings.getTrackingDuration();
    let selectedPaths = await this.mapSettings.getPaths();
    this.storageUsage = this.storageService.estimate()
      .then((estimation) => `${estimation.usage} / ${estimation.quota}`);
    this.cacheLength = await this.storageService.getCachedTilesCount();
  }

  allDurations = this._durations;
  selectedDuration: number;
  storageUsage: Promise<string>;
  cacheLength: number;

  okClick() {
    this.mapSettings.setTrackingDuration(this.selectedDuration);
    this.modalCtrl.dismiss();
  }
}
