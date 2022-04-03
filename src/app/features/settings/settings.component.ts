import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  constructor(private modalCtrl: ModalController, private service: SettingsService) { }

  storageUsage: Promise<string>;
  cacheLength: number;

  async ngOnInit() {
    this.storageUsage = this.service.estimate()
      .then((estimation) => `${estimation.usage} / ${estimation.quota}`);
    this.cacheLength = await this.service.getCachedTilesCount();
  }

  okClick() {
    this.modalCtrl.dismiss();
  }
}
