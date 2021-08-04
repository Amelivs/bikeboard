import { Injectable } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import { bufferCount, filter, first, last, map, switchMap, takeUntil } from 'rxjs/operators';
import { Coordinate } from 'ol/coordinate';
import { getTransformFromProjections, ProjectionLike, get as getProjection } from 'ol/proj';
import { CompassService } from './compass.service';
import { LocationService } from './location.service';
import { toRadians } from 'ol/math';
import { LastPositionService } from './last-position.service';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    private readonly $position = new Subject<Coordinate>();
    private readonly $rotation = new Subject<number>();

    private readonly unsubscribeLocation = new Subject<void>();
    private readonly unsubscribeHeading = new Subject<void>();

    private isTracking = false;

    public constructor(private locationSrv: LocationService, private compassSrv: CompassService, private lastPositionSrv: LastPositionService) { }

    public readonly position = this.$position.asObservable();
    public readonly rotation = this.$rotation.asObservable();

    public startTracking(proj: ProjectionLike) {
        this.stopTracking();

        let transform = getTransformFromProjections(
            getProjection('EPSG:4326'),
            getProjection(proj)
        );

        let location = this.locationSrv.location.pipe(takeUntil(this.unsubscribeLocation));

        // Track first and last position
        merge(location.pipe(first()), location.pipe(last()))
            .subscribe(position => {
                this.lastPositionSrv.setLastPosition(position);
            });

        this.isTracking = true;
        location.subscribe(pos => {
            this.$position.next(transform(pos));
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

    public async startRotationTracking() {
        this.stoptRotationTracking();

        let granted = await this.compassSrv.requestPermission();
        if (!granted) {
            this.$rotation.error(new Error('User denied orientation'));
            return;
        }

        let previousSpeed: number = null;

        merge(this.locationSrv.speed
            .pipe(map(speed => isNaN(speed) || speed == null ? 0 : speed))
            .pipe(bufferCount(3)), of([]))
            .pipe(map(values => {
                if (values.length == 0) {
                    return 0;
                }
                return values.reduce((prev, curr) => prev + curr, 0) / values.length;
            }))
            .pipe(filter(speed => {
                if (speed < 1.0 && previousSpeed != null && previousSpeed < 1.0) {
                    console.debug('Keeping compass heading');
                    return false;
                }
                if (speed >= 1.0 && previousSpeed != null && previousSpeed >= 1.0) {
                    console.debug('Keeping GPS heading');
                    return false;
                }
                previousSpeed = speed;
                return true;
            }))
            .pipe(switchMap(speed => {
                if (speed < 1.0) {
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
                this.$rotation.next(toRadians((360 - heading) % 360));
            }, err => {
                console.error(err);
            });
    }

    public stoptRotationTracking() {
        this.unsubscribeHeading.next();
    }
}
