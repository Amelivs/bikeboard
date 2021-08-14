import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, share } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class LocationService {

    private readonly position$: Observable<Coordinates>;

    private createObservable() {
        return new Observable<Coordinates>(observer => {
            let watchId = navigator.geolocation.watchPosition(position => {
                observer.next(position.coords);
                console.debug('watchPosition: received coords ', position.coords);
            }, error => {
                observer.error(error);
            }, {
                enableHighAccuracy: true
            });
            console.info('watchPosition started with id', watchId);

            return () => {
                navigator.geolocation.clearWatch(watchId);
                console.info('watchPosition cleared  with id', watchId);
            }
        });
    }

    public constructor() {
        this.position$ = this.createObservable().pipe(share());
        this.location = this.position$.pipe(map(coords => [coords.longitude, coords.latitude]));
        this.speed = this.position$.pipe(map(coords => coords.speed));
        this.heading = this.position$.pipe(map(coords => coords.heading));
        this.altitude = this.position$.pipe(map(coords => coords.altitude));
    }

    public readonly location: Observable<number[]>;
    public readonly speed: Observable<number>;
    public readonly heading: Observable<number>;
    public readonly altitude: Observable<number>;
}