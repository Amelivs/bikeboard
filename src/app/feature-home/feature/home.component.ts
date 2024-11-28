import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActionSheetController, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';

import { SettingsNavComponent } from '../../feature-settings/settings-nav.component';
import { OverlayService } from '../../core/services/overlay.service';
import { ImportMapComponent } from '../../feature-import/feature/import-map/import-map.component';
import { DebuggingComponent } from '../../feature-debugging/feature/debugging.component';
import { ImportPathComponent } from '../../feature-import/feature/import-path/import-path.component';
import { MenuComponent } from '../ui/menu/menu.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MenuComponent, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton, IonIcon, IonRouterOutlet]
})
export class HomeComponent {
  private readonly overlaySrv = inject(OverlayService);
  private readonly actionSheetController = inject(ActionSheetController);

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
