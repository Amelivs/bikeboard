import { Component, OnInit } from '@angular/core';
import { IonNav, ModalController } from '@ionic/angular';
import { UnlockService } from 'src/app/core/services/unlock.service';

import { environment } from '../../../../environments/environment';
import { AttributionsComponent } from '../attributions/attributions.component';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-home-settings',
  templateUrl: './home-settings.component.html',
  styleUrls: ['./home-settings.component.scss'],
})
export class HomeSettingsComponent implements OnInit {

  constructor(private modalCtrl: ModalController, private service: SettingsService, private unlockService: UnlockService, private nav: IonNav) { }

  appVersion = environment.appVersion;
  cachedTilesCount: number;

  async ngOnInit() {
    this.cachedTilesCount = await this.service.countCachedTiles();
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async resetClick() {
    if (!confirm('All application settings and data will be lost.')) {
      return;
    }
    await this.service.reset();
    location.reload();
  }

  async unlockClick() {
    try {
      let key = prompt('Enter key');
      if (key != null) {
        await this.unlockService.unlock(key);
        alert('Advanced features unlocked successfully.');
      }
    }
    catch (err) {
      console.error(err);
      alert('Advanced features could not be unlocked.');
    }
  }

  attributionClick() {
    this.nav.push(AttributionsComponent);
  }
}
