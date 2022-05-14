import { Component, OnInit } from '@angular/core';
import { IonNav, ModalController } from '@ionic/angular';

import { environment } from '../../../../environments/environment';
import { AttributionsComponent } from '../attributions/attributions.component';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-home-settings',
  templateUrl: './home-settings.component.html',
  styleUrls: ['./home-settings.component.scss'],
})
export class HomeSettingsComponent implements OnInit {

  constructor(private modalCtrl: ModalController, private service: SettingsService, private nav: IonNav) { }

  appVersion = environment.appVersion;
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

  clearClick() {
    this.service.clearCache();
  }

  attributionClick() {
    this.nav.push(AttributionsComponent);
  }
}
