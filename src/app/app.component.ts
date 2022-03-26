import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { MapSettingsComponent } from './core/components/map-settings/map-settings.component';
import { UpdateService } from './core/services/update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor(private sw: UpdateService, private modalController: ModalController) {
    this.sw.checkForUpdates();
  }

  async mapSettingsClick() {
    const modal = await this.modalController.create({
      component: MapSettingsComponent,
    });
    await modal.present();
  }
}
