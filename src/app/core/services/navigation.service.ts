import { Injectable } from '@angular/core';
import { merge, Subject } from 'rxjs';
import { bufferCount, bufferTime, defaultIfEmpty, filter, first, last, map, startWith, switchMap, takeUntil } from 'rxjs/operators';

import { CompassService } from './compass.service';
import { LocationService } from './location.service';
import { LastPositionService } from './last-position.service';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    /** 9km/h */
    private readonly speedThreshold = 2.5;

    private readonly $position = new Subject<number[]>();
    private readonly $heading = new Subject<number>();
    private readonly $speed = new Subject<number>();
    private readonly $altitude = new Subject<number>();

    private readonly unsubscribeLocation = new Subject<void>();
    private readonly unsubscribeHeading = new Subject<void>();

    private isTracking = false;

    public constructor(private locationSrv: LocationService, private compassSrv: CompassService, private lastPositionSrv: LastPositionService) { }

    public readonly position = this.$position.asObservable();
    public readonly heading = this.$heading.asObservable();
    public readonly speed = this.$speed.asObservable();
    public readonly altitude = this.$altitude.asObservable();

    public startTracking() {
        this.stopTracking();

        let location = this.locationSrv.location.pipe(takeUntil(this.unsubscribeLocation));
        let speed = this.locationSrv.speed.pipe(takeUntil(this.unsubscribeLocation));
        let altitude = this.locationSrv.altitude.pipe(takeUntil(this.unsubscribeLocation));

        speed
            .pipe(filter(value => typeof (value) === 'number' && !isNaN(value)))
            .pipe(bufferTime(6000, null, 1))
            .pipe(map(values => {
                if (values.length === 0) {
                    return 0;
                }
                return 3.6 * values[0];
            }))
            .subscribe(speed => {
                this.$speed.next(speed);
            }, err => {
                this.$speed.error(err);
                console.error(err);
            }, () => {
                this.$speed.next(null);
            });

        let alt = altitude
            .pipe(filter(value => typeof (value) === 'number' && !isNaN(value)));

        alt.pipe(defaultIfEmpty(null), first()).subscribe(first => {
            this.$altitude.next(first);
        });

        alt.pipe(bufferTime(6000, null, 6))
            .pipe(map(values => {
                if (values.length === 0) {
                    return 0;
                }
                return values.reduce((prev, curr) => prev + curr, 0) / values.length;
            }))
            .subscribe(altitude => {
                this.$altitude.next(altitude);
            }, err => {
                this.$altitude.error(err);
                console.error(err);
            }, () => {
                this.$altitude.next(null);
            });

        // Track first and last position
        merge(location.pipe(first()), location.pipe(last()))
            .subscribe(position => {
                this.lastPositionSrv.setLastPosition(position);
            });

        this.isTracking = true;
        location.subscribe(pos => {
            this.$position.next(pos);
        }, err => {
            this.$position.error(err);
            console.error(err);
        }, () => {
            this.isTracking = false;
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

        this.locationSrv.speed
            .pipe(map(speed => isNaN(speed) || speed == null ? 0 : speed))
            .pipe(bufferCount(3))
            .pipe(startWith<number[]>([]))
            .pipe(map(values => {
                if (values.length === 0) {
                    return 0;
                }
                return values.reduce((prev, curr) => prev + curr, 0) / values.length;
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
                    return this.locationSrv.heading;
                }
            }))
            .pipe(takeUntil(this.unsubscribeHeading))
            .subscribe(heading => {
                this.$heading.next(heading);
            }, err => {
                console.error(err);
            });

        return true;
    }

    public stoptHeadingTracking() {
        this.unsubscribeHeading.next();
    }
}
