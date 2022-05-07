import { Injectable } from '@angular/core';
import { all } from 'ol/events/condition';
import { ReplaySubject, Subject } from 'rxjs';

import { DataContext } from '../data/data-context';
import { Track, TrackPoint, TrackSegment } from '../data/entities/track';

@Injectable({
    providedIn: 'root'
})
export class TrackingService {

    private track: Track;
    private distance = 0;

    public readonly distance$ = new ReplaySubject<number>(1);

    private getDistance() {
        let dist = 0;
        for (let segment of this.track.segments) {
            if (segment.points == null) {
                continue;
            }
            for (let i = 0; i < segment.points.length; i++) {
                let p1 = segment.points[i];
                let p2 = segment.points[i + 1];

                if (p2 == null) {
                    break;
                }
                dist += this.getDistanceBetween(p1, p2);
            }
        }
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

    public async initialize() {
        this.track = await this.dataContext.currentTrack.get() ?? { segments: [] };
        this.distance = this.getDistance();
        this.distance$.next(this.distance);
    }

    public async beginSegment() {
        this.track.segments.push({ points: [] });
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

        let segment = this.track.segments[this.track.segments.length - 1];
        let lastPoint = segment.points[segment.points.length - 1];

        if (lastPoint != null) {
            this.distance += this.getDistanceBetween(lastPoint, point);
            this.distance$.next(this.distance);
        }

        segment.points.push(point);
    }

    public async saveTrack() {
        await this.dataContext.currentTrack.save(this.track);
    }

    public async clearMileage() {
        if (!confirm('The current mileage will be lost. Are you sure?')) {
            return;
        }
        this.track = { segments: [] };
        await this.dataContext.currentTrack.save(null);
        this.distance = 0;
        this.distance$.next(this.distance);
    }

    public async export() {
        let track = await this.dataContext.currentTrack.get() ?? { segments: [] };
        let lines = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="MapTracker" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">');
        lines.push('<trk>');
        for (let segment of track.segments) {
            lines.push('<trkseg>');
            for (let point of segment.points) {
                let timestamp = new Date(point.timestamp);
                lines.push(`<trkpt lat="${point.latitude.toFixed(7)}" lon="${point.longitude.toFixed(7)}"><ele>${point.altitude.toFixed(1)}</ele><time>${timestamp.toISOString()}</time></trkpt>`);
            }
            lines.push('</trkseg>');
        }
        lines.push('</trk>');
        lines.push('</gpx>');
        return new Blob([lines.join('')], { type: 'application/gpx+xml' });
    }
}
