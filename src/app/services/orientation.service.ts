import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class OrientationService {

    private hasPermission = false;

    private readonly $heading = new ReplaySubject<number>(1);

    private orientationChangeHandler = (event: DeviceOrientationEvent) => {
        this.onOrientationChange(event);
    };

    public constructor() { }

    public readonly heading = this.$heading.asObservable();

    private async requestPermission() {
        if (this.hasPermission) {
            return;
        }
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            var permissionState = await DeviceOrientationEvent.requestPermission();
            this.hasPermission = permissionState !== 'denied';
        } else {
            this.hasPermission = true;
        }
    }

    public async startTracking() {
        await this.requestPermission();
        if (!this.hasPermission) {
            return;
        }
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', this.orientationChangeHandler);
        }
        else if ('ondeviceorientation' in window) {
            window.addEventListener('deviceorientation', this.orientationChangeHandler);
        }
    }

    public stopTracking() {
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', this.orientationChangeHandler);
        }
        else if ('ondeviceorientation' in window) {
            window.removeEventListener('deviceorientation', this.orientationChangeHandler);
        }
    }

    private onOrientationChange(event: DeviceOrientationEvent) {
        var alpha: number = null;
        if (event.absolute) {
            alpha = event.alpha;
        }
        else {
            var heading = event['webkitCompassHeading'] as number;
            if (heading != null) {
                alpha = -1 * heading;
            }
        }
        if (alpha != null) {
            this.$heading.next(alpha);
        }
    }
}