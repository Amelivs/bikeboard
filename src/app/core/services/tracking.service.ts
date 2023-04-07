import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ReplaySubject } from 'rxjs';

import { DataContext } from '../data/data-context';
import { Activity, ActivityPoint } from '../data/entities/activity';
import { DistanceUtil } from '../utils/distance';
import { UUID } from '../utils/uuid';
import { DialogService } from './dialog.service';

const MAX_COORDS_ACCURACY = 20;


@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  private activity: Activity | nil;

  public readonly distance$ = new ReplaySubject<number>(1);

  public constructor(public dataContext: DataContext, private platform: Platform, private dialogSrv: DialogService) { }

  public async initialize(newActivity = false) {
    if (!newActivity) {
      let activityId = await this.dataContext.preferences.get<string>('currentActivityId');
      if (activityId) {
        this.activity = await this.dataContext.activities.get(activityId);
      }
    }
    if (this.activity == null || newActivity === true) {
      this.activity = { id: UUID.next(), segments: [], startDate: new Date(), distance: 0, duration: 0 };
      await this.dataContext.activities.save(this.activity);
      await this.dataContext.preferences.save('currentActivityId', this.activity.id);
    }
    this.activity.distance = DistanceUtil.getDistance(this.activity);
    this.distance$.next(this.activity.distance);
  }

  public async beginSegment() {
    this.activity!.segments.push({ points: [] });
  }

  public addTrackPoint(position: GeolocationPosition) {
    if (position.coords.accuracy > MAX_COORDS_ACCURACY && !this.platform.is('desktop')) {
      return;
    }
    let point: ActivityPoint =
    {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude ?? 0,
      heading: position.coords.heading ?? 0,
      speed: position.coords.speed ?? 0,
      timestamp: position.timestamp
    };

    let segment = this.activity!.segments[this.activity!.segments.length - 1];
    let lastPoint = segment.points[segment.points.length - 1];

    if (lastPoint != null) {
      this.activity!.distance += DistanceUtil.getDistanceBetween(lastPoint, point);
      this.distance$.next(this.activity!.distance);
    }

    segment.points.push(point);

    this.activity!.duration = DistanceUtil.getDuration(this.activity!);
  }

  public async saveTrack() {
    await this.dataContext.activities.save(this.activity!);
  }

  public async startNewActivity() {
    if (!this.dialogSrv.confirm('Start a new activity?')) {
      return;
    }
    await this.initialize(true);
  }
}
