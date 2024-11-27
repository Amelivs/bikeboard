import { Component, OnInit, inject } from '@angular/core';
import { IonItemSliding, ModalController, IonicModule } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';

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
  providers: [ActivitiesServices],
  standalone: true,
  imports: [IonicModule, NgFor, AsyncPipe, DistancePipe, DurationPipe, LocaleDatePipe]
})
export class ActivitiesComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly service = inject(ActivitiesServices);
  private readonly dialogSrv = inject(DialogService);

  private async loadData() {
    let activities = await this.service.getActivities();
    this.activities$.next(activities);
  }

  readonly activities$ = new BehaviorSubject<Activity[]>([]);

  ngOnInit() {
    this.loadData()
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
