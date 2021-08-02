import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import { fromEvent, Observable } from "rxjs";
import { map, share } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class CompassService {

    public readonly heading: Observable<number>;

    private get orientationEvent() {
        if (this.platform.is('desktop')) {
            return 'deviceorientation';
        }
        if ('ondeviceorientationabsolute' in window) {
            return 'deviceorientationabsolute';
        }
        if ('ondeviceorientation' in window) {
            return 'deviceorientation';
        }
    }

    private createObservable() {
        return fromEvent<DeviceOrientationEvent>(window, this.orientationEvent)
            .pipe(map(event => {
                if ((event.absolute || this.platform.is('desktop')) && event.alpha != null) {
                    return 360 - event.alpha;
                }
                var heading = event['webkitCompassHeading'] as number;
                if (heading != null) {
                    return heading;
                }
                return 0;
            }));
    }

    public constructor(private platform: Platform) {
        this.heading = this.createObservable().pipe(share());
    }

    public async requestPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            var permissionState = await DeviceOrientationEvent.requestPermission();
            return permissionState !== 'denied';
        };
        return true;
    }
}