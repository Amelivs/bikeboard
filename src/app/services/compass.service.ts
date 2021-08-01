import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class CompassService {

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

    public constructor(private platform: Platform) { }

    public async requestPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            var permissionState = await DeviceOrientationEvent.requestPermission();
            return permissionState !== 'denied';
        };
        return true;
    }

    public getHeading() {
        return fromEvent<DeviceOrientationEvent>(window, this.orientationEvent)
            .pipe(map(event => {
                if ((event.absolute || this.platform.is('desktop')) && event.alpha != null) {
                    return event.alpha;
                }
                var heading = event['webkitCompassHeading'] as number;
                if (heading != null) {
                    return (-1 * heading);
                }
                return 0;
            }));
    }
}