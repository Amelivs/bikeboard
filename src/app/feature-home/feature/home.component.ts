import { Component, OnInit } from '@angular/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { SettingsNavComponent } from 'src/app/feature-settings/settings-nav.component';
import { OverlayService } from 'src/app/core/services/overlay.service';

import { ImportMapComponent } from '../../feature-import/feature/import-map/import-map.component';
import { DebuggingComponent } from '../../feature-debugging/feature/debugging.component';
import { ImportPathComponent } from '../../feature-import/feature/import-path/import-path.component';
import { MenuComponent } from '../ui/menu/menu.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [IonicModule, MenuComponent]
})
export class HomeComponent implements OnInit {

  constructor(private overlaySrv: OverlayService, public actionSheetController: ActionSheetController) { }

  ngOnInit(): void { }

  mapSettingsClick() {
    this.overlaySrv.showModal(SettingsNavComponent)
  }

  titlePress() {
    this.overlaySrv.showModal(DebuggingComponent)
  }

  async addClick() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Import',
      buttons: [
        {
          text: 'Import a new map',
          icon: 'map-outline',
          handler: () => {
            this.overlaySrv.showModal(ImportMapComponent)
          }
        },
        {
          text: 'Import a new path',
          icon: 'analytics-outline',
          handler: () => {
            this.overlaySrv.showModal(ImportPathComponent)
          }
        }]
    });
    await actionSheet.present();
  }
}
