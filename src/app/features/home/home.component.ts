import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { ImportPathComponent } from 'src/app/features/import-path/import-path.component';
import { SettingsComponent } from 'src/app/features/settings/settings.component';

import { ImportMapComponent } from '../import-map/import-map.component';
import { DebuggingComponent } from '../debugging/debugging.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private modalController: ModalController, public actionSheetController: ActionSheetController) { }

  ngOnInit(): void { }

  mapSettingsClick() {
    this.modalController
      .create({ component: SettingsComponent })
      .then(modal => modal.present());
  }

  titlePress() {
    this.modalController
      .create({ component: DebuggingComponent })
      .then(modal => modal.present());
  }

  async addClick() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Import',
      buttons: [
        {
          text: 'Import a new map',
          icon: 'map-outline',
          handler: () => {
            this.modalController
              .create({ component: ImportMapComponent })
              .then(modal => modal.present());
          }
        },
        {
          text: 'Import a new path',
          icon: 'analytics-outline',
          handler: () => {
            this.modalController
              .create({ component: ImportPathComponent })
              .then(modal => modal.present());
          }
        }]
    });
    await actionSheet.present();
  }
}
