import { Component, OnInit } from '@angular/core';
import { IonItemSliding, ModalController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Activity } from 'src/app/core/data/entities/activity';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { DownloadUtils } from 'src/app/core/utils/download';

import { ActivitiesServices } from './activities.service';


@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [ActivitiesServices]
})
export class ActivitiesComponent implements OnInit {

  private async loadData() {
    let activities = await this.service.getActivities();
    this.activities$.next(activities);
  }

  constructor(private modalCtrl: ModalController, private service: ActivitiesServices, private dataCache: DataCacheService) { }

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
    if (confirm(`This activity will be lost. Are you sure?`)) {
      await this.service.deleteActivity(activity.id);
    }
    item.close();
  }
}
