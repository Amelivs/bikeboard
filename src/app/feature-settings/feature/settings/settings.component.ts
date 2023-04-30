import { Component, OnInit } from '@angular/core';
import { IonNav, ModalController } from '@ionic/angular';
import { DialogService } from 'src/app/core/services/dialog.service';

import { environment } from '../../../../environments/environment';
import { AttributionsComponent } from '../attributions/attributions.component';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [SettingsService]
})
export class SettingsComponent implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private service: SettingsService,
    private nav: IonNav,
    private window: Window,
    private dialogSrv: DialogService) { }

  appVersion = environment.appVersion;
  cachedTilesCount = 0;

  async ngOnInit() {
    this.cachedTilesCount = await this.service.countCachedTiles();
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async resetClick() {
    if (!this.dialogSrv.confirm('All application settings and data will be lost.')) {
      return;
    }
    await this.service.reset();
    this.window.location.reload();
  }

  attributionClick() {
    this.nav.push(AttributionsComponent);
  }
}
