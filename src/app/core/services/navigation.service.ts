import { Injectable } from '@angular/core';
import { from, merge, Subject } from 'rxjs';
import { bufferCount, bufferTime, defaultIfEmpty, filter, first, last, map, startWith, switchMap, takeUntil } from 'rxjs/operators';

import { CompassService } from './compass.service';
import { LocationService } from './location.service';
import { LastPositionService } from './last-position.service';
import { TrackingService } from './tracking.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  /** 9km/h */
  private readonly speedThreshold = 2.5;

  private readonly $position = new Subject<GeolocationCoordinates>();
  private readonly $heading = new Subject<number>();
  private readonly $speed = new Subject<number>();
  private readonly $altitude = new Subject<number>();

  private readonly unsubscribeLocation = new Subject<void>();
  private readonly unsubscribeHeading = new Subject<void>();

  private isTracking = false;

  public constructor(private locationSrv: LocationService, private compassSrv: CompassService, private lastPositionSrv: LastPositionService, private trackingService: TrackingService) { }

  public readonly position = this.$position.asObservable();
  public readonly heading = this.$heading.asObservable();
  public readonly speed = this.$speed.asObservable();
  public readonly altitude = this.$altitude.asObservable();

  public startTracking() {
    this.stopTracking();

    let position = this.locationSrv.watchPosition.pipe(takeUntil(this.unsubscribeLocation));

    position
      .pipe(map(position => position.coords.speed))
      .pipe(filter(speed => typeof (speed) === 'number' && !isNaN(speed)))
      .pipe(bufferTime(3000, null, 3))
      .pipe(map(speeds => {
        if (speeds.length === 0) {
          return 0;
        }
        return 3.6 * speeds.reduce((prev, curr) => prev + curr, 0) / speeds.length;
      }))
      .subscribe({
        next: speed => {
          this.$speed.next(speed);
        },
        error: err => {
          this.$speed.error(err);
          console.error(err);
        },
        complete: () => {
          this.$speed.next(null);
        }
      });

    let alt = position
      .pipe(map(position => position.coords.altitude))
      .pipe(filter(altitude => typeof (altitude) === 'number' && !isNaN(altitude)));

    alt.pipe(defaultIfEmpty(null), first()).subscribe(first => {
      this.$altitude.next(first);
    });

    alt.pipe(bufferTime(6000, null, 6))
      .pipe(map(altitudes => {
        if (altitudes.length === 0) {
          return 0;
        }
        return altitudes.reduce((prev, curr) => prev + curr, 0) / altitudes.length;
      }))
      .subscribe({
        next: altitude => {
          this.$altitude.next(altitude);
        },
        error: err => {
          this.$altitude.error(err);
          console.error(err);
        },
        complete: () => {
          this.$altitude.next(null);
        }
      });

    // Track first and last position
    merge(position.pipe(first()), position.pipe(last()))
      .subscribe(position => {
        this.lastPositionSrv.setLastPosition([position.coords.longitude, position.coords.latitude]);
      });

    this.isTracking = true;
    let trackedPosition$ = from(this.trackingService.beginSegment()).pipe(switchMap(() => position));
    trackedPosition$.subscribe({
      next: position => {
        this.$position.next(position.coords);
        this.trackingService.addTrackPoint(position);
      },
      error: err => {
        this.$position.error(err);
        console.error(err);
      },
      complete: async () => {
        this.isTracking = false;
        await this.trackingService.saveTrack();
      }
    });
    // save the track every 8 points.
    trackedPosition$.pipe(bufferCount(8)).subscribe(async () => {
      await this.trackingService.saveTrack();
    });
  }

  public stopTracking() {
    this.unsubscribeLocation.next();
    this.unsubscribeHeading.next();
  }

  public getTracking() {
    return this.isTracking;
  }

  public async startHeadingTracking() {
    this.stoptHeadingTracking();

    if (this.compassSrv.queryPermission() !== 'granted') {
      let permission = await this.compassSrv.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    let previousSpeed: number = null;

    this.locationSrv.watchPosition
      .pipe(map(position => position.coords.speed))
      .pipe(map(speed => isNaN(speed) || speed == null ? 0 : speed))
      .pipe(bufferCount(3))
      .pipe(startWith<number[]>([]))
      .pipe(map(speeds => {
        if (speeds.length === 0) {
          return 0;
        }
        return speeds.reduce((prev, curr) => prev + curr, 0) / speeds.length;
      }))
      .pipe(filter(speed => {
        if (speed < this.speedThreshold && previousSpeed != null && previousSpeed < this.speedThreshold) {
          console.debug('Keeping compass heading');
          return false;
        }
        if (speed >= this.speedThreshold && previousSpeed != null && previousSpeed >= this.speedThreshold) {
          console.debug('Keeping GPS heading');
          return false;
        }
        previousSpeed = speed;
        return true;
      }))
      .pipe(switchMap(speed => {
        if (speed < this.speedThreshold) {
          console.debug('Switching to compass heading');
          return this.compassSrv.heading;
        }
        else {
          console.debug('Switching to GPS heading');
          return this.locationSrv.watchPosition.pipe(map(position => position.coords.heading));
        }
      }))
      .pipe(takeUntil(this.unsubscribeHeading))
      .subscribe({
        next: heading => {
          this.$heading.next(heading);
        },
        error: err => {
          console.error(err);
        }
      });

    return true;
  }

  public stoptHeadingTracking() {
    this.unsubscribeHeading.next();
  }
}
