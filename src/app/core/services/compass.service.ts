import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { fromEvent, Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CompassService {

    private permissionState: PermissionState = 'prompt';
    public readonly heading: Observable<number>;

    private get orientationEvent() {
        if (this.platform.is('desktop')) {
            return 'deviceorientation';
        }
        if ('ondeviceorientationabsolute' in window) {
            return 'deviceorientationabsolute';
        }
        return 'deviceorientation';
    }

    private createObservable() {
        return fromEvent<DeviceOrientationEvent>(window, this.orientationEvent)
            .pipe(map(event => {
                if ((event.absolute || this.platform.is('desktop')) && event.alpha != null) {
                    return (360 - event.alpha) % 360;
                }
                let heading = (event as any).webkitCompassHeading as number;
                if (heading != null) {
                    return heading;
                }
                return 0;
            }));
    }

    public constructor(private platform: Platform) {
        this.heading = this.createObservable().pipe(share());
    }

    public queryPermission() {
        return this.permissionState;
    }

    public async requestPermission() {
        if ('requestPermission' in DeviceOrientationEvent) {
            this.permissionState = await (DeviceOrientationEvent as any).requestPermission();
        }
        else {
            this.permissionState = 'granted';
        }
        return this.permissionState;
    }
}
