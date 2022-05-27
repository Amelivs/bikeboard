import { Injectable } from '@angular/core';

import SeedingData from '../../../seeding.json';

export interface DirectionResult {
    format: 'WKT' | 'GeoJSON';
    data: any;
}

@Injectable({
    providedIn: 'root'
})
export class DirectionService {

    public async getDirection(origin: number[], waypoints: number[][], destination: number[], providerName: string): Promise<DirectionResult> {
        let provider = SeedingData.directionProviders.find(p => p.name === providerName);
        if (provider == null) {
            throw new Error(`Direction provider ${providerName} not found`);
        }

        let url = provider.url;

        if (provider.waypointsOnly) {
            let points = [origin, ...waypoints, destination];
            url = url.replace('{{WAYPOINTS}}', points.map(p => `${provider.waypointPrefix}${p[0]},${p[1]}`).join(provider.separator));
        }
        else {
            url = url.replace('{{ORIGIN}}', origin.join(','))
                .replace('{{DESTINATION}}', destination.join(','))
                .replace('{{WAYPOINTS}}', waypoints.map(p => `${p[0]},${p[1]}`).join(provider.separator));
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return {
            format: provider.format as any,
            data: await res.json()
        };
    }
}
