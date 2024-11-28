import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ModalController, IonNav, IonContent, IonToolbar, IonButtons, IonHeader, IonButton, IonTitle, IonList, IonListHeader, IonLabel, IonItem, IonText } from '@ionic/angular/standalone';

import { DialogService } from '../../../core/services/dialog.service';
import { environment } from '../../../../environments/environment';
import { AttributionsComponent } from '../attributions/attributions.component';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonToolbar, IonButtons, IonHeader, IonButton, IonTitle, IonList, IonListHeader, IonLabel, IonItem, IonText],
  providers: [SettingsService]
})
export class SettingsComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly service = inject(SettingsService);
  private readonly nav = inject(IonNav);
  private readonly window = inject(Window);
  private readonly dialogSrv = inject(DialogService);

  readonly appVersion = environment.appVersion;
  readonly cachedTilesCount = signal(0);

  async ngOnInit() {
    this.cachedTilesCount.set(await this.service.countCachedTiles());
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
