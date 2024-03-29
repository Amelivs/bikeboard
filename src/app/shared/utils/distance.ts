import { Activity, ActivityPoint } from '../../core/data/entities/activity';


export class DistanceUtil {

  public static getDistance(activity: Activity) {
    let dist = 0;
    for (let segment of activity.segments) {
      if (segment.points == null) {
        continue;
      }
      for (let i = 0; i < segment.points.length; i++) {
        let p1 = segment.points[i];
        let p2 = segment.points[i + 1];

        if (p2 == null) {
          break;
        }
        dist += this.getDistanceBetween(p1, p2);
      }
    }
    return dist;
  }

  public static getDistanceBetween(p1: ActivityPoint, p2: ActivityPoint) {
    const R = 6371e3; // metres
    const φ1 = p1.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = p2.latitude * Math.PI / 180;
    const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
    const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  public static getDuration(activity: Activity) {
    let durationMs = 0;

    for (let segment of activity.segments) {
      if (segment.points == null || segment.points.length === 0) {
        continue;
      }

      let points = segment.points.map(pt => pt.timestamp).filter(ts => !Number.isNaN(ts));
      let min = Math.min(...points);
      let max = Math.max(...points);

      durationMs += max - min;
    }
    return durationMs;
  }
}
