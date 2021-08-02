import { Injectable } from "@angular/core";
import { asyncScheduler, EMPTY, merge, of, race, Subject } from "rxjs";
import { buffer, bufferCount, bufferTime, debounce, debounceTime, delay, filter, map, mergeMap, mergeMapTo, subscribeOn, switchMap, takeUntil, throttle, throttleTime, timeout, timeoutWith } from "rxjs/operators";
import { Coordinate } from "ol/coordinate";
import { getTransformFromProjections, ProjectionLike, get as getProjection, transform } from "ol/proj";
import { CompassService } from "./compass.service";
import { LocationService } from "./location.service";
import { toRadians } from 'ol/math';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    private readonly $position = new Subject<Coordinate>();
    private readonly $rotation = new Subject<number>();

    private readonly unsubscribeLocation = new Subject<void>();
    private readonly unsubscribeHeading = new Subject<void>();

    public constructor(private locationSrv: LocationService, private compassSrv: CompassService) { }

    public readonly position = this.$position.asObservable();
    public readonly rotation = this.$rotation.asObservable();

    public startTracking(proj: ProjectionLike) {

        this.compassSrv.requestPermission().then(ok => { });

        this.stopTracking();

        var transform = getTransformFromProjections(
            getProjection('EPSG:4326'),
            getProjection(proj)
        );

        this.locationSrv.location.pipe(takeUntil(this.unsubscribeLocation)).subscribe(pos => {
            this.$position.next(transform(pos));
        }, err => {
            this.$position.error(err);
            console.error(err);
        });
    }

    public stopTracking() {
        this.unsubscribeLocation.next();
        this.unsubscribeHeading.next();
    }

    public getTracking() {
        return true;
    }

    public startRotationTracking() {
        this.stoptRotationTracking();

        var previousSpeed: number = null;

        merge(this.locationSrv.speed
            .pipe(takeUntil(this.unsubscribeHeading))
            .pipe(map(speed => isNaN(speed) || speed == null ? 10 : speed))
            .pipe(bufferTime(3000)), of([]))
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
            .subscribe(heading => {
                this.$rotation.next(toRadians(360 - heading));
            }, err => {
                console.error(err);
            });
    }

    public stoptRotationTracking() {
        this.unsubscribeHeading.next();
    }
}
