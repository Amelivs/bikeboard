import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { IonItemSliding, IonItemOption, IonItemOptions, ModalController, IonHeader, IonToolbar, IonContent, IonButton, IonButtons, IonTitle, IonList, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { NgFor } from '@angular/common';

import { Activity } from '../../core/data/entities/activity';
import { DownloadUtils } from '../../shared/utils/download';
import { DialogService } from '../../core/services/dialog.service';
import { ActivitiesServices } from './activities.service';
import { LocaleDatePipe } from '../../shared/ui/pipes/locale-date.pipe';
import { DurationPipe } from '../../shared/ui/pipes/duration.pipe';
import { DistancePipe } from '../../shared/ui/pipes/distance.pipe';


@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, DistancePipe, DurationPipe, LocaleDatePipe, IonHeader, IonToolbar, IonContent, IonButton, IonButtons, IonTitle, IonList, IonItem, IonItemSliding, IonItemOption, IonItemOptions, IonIcon, IonLabel],
  providers: [ActivitiesServices]
})
export class ActivitiesComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly service = inject(ActivitiesServices);
  private readonly dialogSrv = inject(DialogService);

  readonly activities = signal<Activity[]>([]);

  private async loadData() {
    let activities = await this.service.getActivities();
    this.activities.set(activities);
  }

  async ngOnInit() {
    await this.loadData()
      .catch(err => {
        console.error(err);
      });
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async shareActivity(item: IonItemSliding, activity: Activity) {
    item.close();
    let data = await this.service.export(activity.id);
    let now = new Date();
    await DownloadUtils.download(data, `trace-${now.toISOString()}.gpx`);
  }

  async deleteActivity(item: IonItemSliding, activity: Activity) {
    if (this.dialogSrv.confirm(`This activity will be lost. Are you sure?`)) {
      await this.service.deleteActivity(activity.id);
    }
    item.close();
  }
}
