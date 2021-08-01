import { Injectable } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { bufferCount, bufferTime, map, mergeMap, mergeMapTo, takeUntil, timeout, timeoutWith } from "rxjs/operators";
import { Geolocation } from 'ol';
import { Coordinate } from "ol/coordinate";
import { getTransformFromProjections, ProjectionLike, get as getProjection, transform } from "ol/proj";
import { ListenerFunction } from "ol/events";
import { CompassService } from "./compass.service";
import { LocationService } from "./location.service";

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    private readonly $position = new Subject<Coordinate>();
    private readonly $heading = new Subject<number>();

    private readonly unsubscribeLocation = new Subject<void>();
    private readonly unsubscribeHeading = new Subject<void>();

    private isCompassHeading: boolean;

    public constructor(private location: LocationService, private compass: CompassService) { }

    public readonly position = this.$position.asObservable();
    public readonly heading = this.$heading.asObservable();

    public startTracking(proj: ProjectionLike) {

        this.compass.requestPermission().then(ok => { });

        this.stopTracking();

        var transform = getTransformFromProjections(
            getProjection('EPSG:4326'),
            getProjection(proj)
        );

        this.location.getLocation().pipe(takeUntil(this.unsubscribeLocation)).subscribe(pos => {
            this.$position.next(transform(pos));
        }, err => {
            this.$position.error(err);
            console.error(err);
        });

        this.location.getSpeed()
            .pipe(takeUntil(this.unsubscribeLocation))
            .pipe(bufferTime(3000))
            .pipe(map(values => {
                if (values.length == 0) {
                    return 0;
                }
                return values.reduce((prev, curr) => prev + curr, 0) / values.length;
            }))
            .subscribe(speed => {
                // ~5km/h
                if (speed < 1.0) {
                    this.useCompassHeading();
                }
                else {
                    this.useGpsHeading();
                }
                this.startHeadingTracking();
            }, err => {
                console.error(err);
            });

        this.useCompassHeading();
    }

    public stopTracking() {
        this.unsubscribeLocation.next();
        this.unsubscribeHeading.next();
        this.isCompassHeading = null;
    }

    public getTracking() {

        return true;
        //  return this.geolocation.getTracking();
    }

    public startHeadingTracking() {
        //   this.headingStrategy?.start();
    }

    public stoptHeadingTracking() {
        this.unsubscribeHeading.next();
        this.isCompassHeading = null;
    }

    private useGpsHeading() {
        if (this.isCompassHeading === false) {
            return;
        }
        this.stoptHeadingTracking();
        this.location.getHeading().pipe(takeUntil(this.unsubscribeHeading)).subscribe(value => {
            this.$heading.next(value);
        }, err => {
            this.$heading.error(err);
            console.error(err);
        });
        this.isCompassHeading = false;
    }

    private useCompassHeading() {
        if (this.isCompassHeading === true) {
            return;
        }
        this.stoptHeadingTracking();
        this.compass.getHeading().pipe(takeUntil(this.unsubscribeHeading)).subscribe(value => {
            this.$heading.next(value);
        }, err => {
            this.$heading.error(err);
            console.error(err);
        });
        this.isCompassHeading = true;
    }
}
