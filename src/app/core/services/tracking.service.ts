import { Injectable } from '@angular/core';
import { all } from 'ol/events/condition';
import { Subject } from 'rxjs';

import { DataContext } from '../data/data-context';
import { Track, TrackPoint } from '../data/entities/track';

@Injectable({
    providedIn: 'root'
})
export class TrackingService {

    private track: Track;
    private distance = 0;

    public readonly distance$ = new Subject<number>();

    private getDistance() {
        if (this.track == null || this.track.points == null) {
            return 0;
        }

        let dist = 0;

        for (let i = 0; i < this.track.points.length; i++) {
            let p1 = this.track.points[i];
            let p2 = this.track.points[i + 1];

            if (p2 == null) {
                return dist;
            }

            dist += this.getDistanceBetween(p1, p2);
        }
        console.log(dist);
        return dist;
    }

    private getDistanceBetween(p1: TrackPoint, p2: TrackPoint) {
        const R = 6371e3; // metres
        const φ1 = p1.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = p2.latitude * Math.PI / 180;
        const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
        const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }

    public constructor(public dataContext: DataContext) { }

    public async beginTrack() {
        this.track = await this.dataContext.currentTrack.get() ?? { points: [] };
        this.distance = this.getDistance();
        this.distance$.next(this.distance);
    }

    public addTrackPoint(position: GeolocationPosition) {
        let point: TrackPoint =
        {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };

        let lastPoint = this.track.points[this.track.points.length - 1];

        if (lastPoint != null) {
            this.distance += this.getDistanceBetween(lastPoint, point);
            this.distance$.next(this.distance);
        }

        this.track.points.push(point);
    }

    public async endTrack() {
        await this.dataContext.currentTrack.save(this.track);
        this.track = null;
    }

    public async clearMileage() {
        if (!confirm('The current mileage will be lost. Are you sure?')) {
            return;
        }
        this.track = { points: [] };
        await this.dataContext.currentTrack.save(null);
        this.distance = 0;
        this.distance$.next(this.distance);
    }

    public async export() {
        let track = await this.dataContext.currentTrack.get() ?? { points: [] };
        let file = '<gpx><trk><trkseg>';
        for (let point of track.points) {
            let timestamp = new Date(point.timestamp);
            file += `<trkpt lat="${point.latitude}" lon="${point.longitude}"><ele>${point.altitude}</ele><time>${timestamp.toISOString()}</time></trkpt>`;
        }
        file += '</trkseg></trk></gpx>';

        return new Blob([file], { type: 'application/gpx+xml' });
    }
}
