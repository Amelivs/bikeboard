import { Injectable } from '@angular/core';
import { DataContext } from 'src/app/core/data/data-context';


@Injectable()
export class ActivitiesServices {

  public constructor(private context: DataContext) { }

  public async getActivities() {
    let activities = await this.context.activities.getAll();
    activities.sort((left, right) => right.startDate?.getTime() - left.startDate?.getTime());
    return activities;
  }

  public async deleteActivity(activityId: string) {
    let currentActivityId = await this.context.preferences.get('currentActivityId');
    if (activityId === currentActivityId) {
      alert('Cannot delete current activity');
      return;
    }
    await this.context.activities.delete(activityId);
  }

  public async export(activityId: string) {
    let activity = await this.context.activities.get(activityId);
    if (activity == null) {
      return;
    }

    let lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="MapTracker" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">');
    lines.push('<trk>');
    for (let segment of activity.segments) {
      lines.push('<trkseg>');
      for (let point of segment.points) {
        let timestamp = new Date(point.timestamp);
        lines.push(`<trkpt lat="${point.latitude.toFixed(7)}" lon="${point.longitude.toFixed(7)}"><ele>${point.altitude.toFixed(1)}</ele><time>${timestamp.toISOString()}</time></trkpt>`);
      }
      lines.push('</trkseg>');
    }
    lines.push('</trk>');
    lines.push('</gpx>');
    return new Blob([lines.join('')], { type: 'application/gpx+xml' });
  }
}
