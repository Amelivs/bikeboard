import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import { fromEvent, ReplaySubject, Subscription } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CompassService {

    private hasPermission = false;
    private readonly $heading = new ReplaySubject<number>(1);
    private orientationSubscription: Subscription;

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
        this.orientationSubscription = fromEvent<DeviceOrientationEvent>(window, this.orientationEvent)
            .subscribe(event => this.onOrientationChange(event));
    }

    public stopTracking() {
        this.orientationSubscription?.unsubscribe();
    }

    private onOrientationChange(event: DeviceOrientationEvent) {
        if ((event.absolute || this.platform.is('desktop')) && event.alpha != null) {
            this.$heading.next(event.alpha);
            return;
        }
        var heading = event['webkitCompassHeading'] as number;
        if (heading != null) {
            this.$heading.next(-1 * heading);
            return;
        }
    }
}