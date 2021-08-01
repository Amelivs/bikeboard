import { Injectable } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { bufferCount, bufferTime, map } from "rxjs/operators";
import { Geolocation } from 'ol';
import { Coordinate } from "ol/coordinate";
import { ProjectionLike } from "ol/proj";
import { ListenerFunction } from "ol/events";
import { CompassService } from "./compass.service";

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    private readonly $position = new Subject<Coordinate>();
    private readonly $speed = new Subject<number>();
    private readonly $heading = new Subject<number>();

    private readonly geolocation = new Geolocation({
        tracking: false,
        trackingOptions: {
            enableHighAccuracy: true,
            maximumAge: 6000
        }
    });

    private headingStrategy: HeadingStrategy;

    public constructor(private orientation: CompassService) {
        this.geolocation.on('change:position', event => {
            this.$position.next(this.geolocation.getPosition())
        });
        this.geolocation.on('change:speed', event => {
            this.$speed.next(this.geolocation.getSpeed())
        });
        this.useCompassHeading();

        this.$speed
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
            });
    }

    public readonly position = this.$position.asObservable();
    public readonly heading = this.$heading.asObservable();

    public startTracking(proj: ProjectionLike) {
        this.geolocation.setProjection(proj);
        this.geolocation.setTracking(true);
    }

    public stopTracking() {
        this.geolocation.setTracking(false);
    }

    public getTracking() {
        return this.geolocation.getTracking();
    }

    public startHeadingTracking() {
        this.headingStrategy?.start();
    }

    public stoptHeadingTracking() {
        this.headingStrategy?.stop();
    }

    public useGpsHeading() {
        if (this.headingStrategy instanceof GpsHeading) {
            return;
        }
        if (this.headingStrategy) {
            this.headingStrategy.stop();
        }
        this.headingStrategy = new GpsHeading(this.geolocation, this.$heading);
    }

    public useCompassHeading() {
        if (this.headingStrategy instanceof CompassHeading) {
            return;
        }
        if (this.headingStrategy) {
            this.headingStrategy.stop();
        }
        this.headingStrategy = new CompassHeading(this.orientation, this.$heading);
    }
}


export interface HeadingStrategy {
    start(): void;
    stop(): void;
}

export class GpsHeading implements HeadingStrategy {

    private listener: ListenerFunction;

    constructor(private geolocation: Geolocation, private $heading: Subject<number>) { }

    start() {
        if (this.listener) {
            return;
        }
        this.listener = this.geolocation.on('change:heading', event => {
            this.$heading.next(-1 * this.geolocation.getHeading() * 180 / Math.PI);
        }).listener;
    }

    stop() {
        if (this.listener) {
            this.geolocation.un('change:heading', this.listener);
            this.listener = null;
        }
    }
}

export class CompassHeading implements HeadingStrategy {

    private subscription: Subscription;

    constructor(private orientation: CompassService, private $heading: Subject<number>) { }

    start() {
        if (this.subscription) {
            return;
        }
        this.subscription = this.orientation.heading.subscribe(heading => {
            this.$heading.next(heading);
        });
        this.orientation.startTracking().then(_ => { });
    }

    stop() {
        this.orientation.stopTracking();
        this.subscription?.unsubscribe();
        this.subscription = null;
    }
}