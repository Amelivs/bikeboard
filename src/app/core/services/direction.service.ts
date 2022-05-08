import { Injectable } from '@angular/core';

export interface DirectionProvider {
    name: string;
    url: string;
    waypointsOnly: boolean;
    separator: string;
    waypointPrefix: string;
    format: 'WKT' | 'GeoJSON';
}

export interface DirectionResult {
    format: 'WKT' | 'GeoJSON';
    data: any;
}

@Injectable({
    providedIn: 'root'
})
export class DirectionService {

    private readonly providers: DirectionProvider[] = [
        {
            name: 'ign',
            format: 'WKT',
            waypointsOnly: false,
            waypointPrefix: '',
            separator: ';',
            url: 'https://wxs.ign.fr/essentiels/itineraire/rest/route.json?origin={{ORIGIN}}&destination={{DESTINATION}}&waypoints={{WAYPOINTS}}&method=DISTANCE&graphName=Pieton'
        },
        {
            name: 'geoapify',
            format: 'GeoJSON',
            waypointsOnly: true,
            waypointPrefix: 'lonlat:',
            separator: '|',
            url: 'https://api.geoapify.com/v1/routing?waypoints={{WAYPOINTS}}&mode=bicycle&apiKey=1b48259b810e48ddb151889f9ea58db0'
        }
    ];

    public async getDirection(origin: number[], waypoints: number[][], destination: number[], providerName: string): Promise<DirectionResult> {
        let provider = this.providers.find(p => p.name === providerName);
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
            format: provider.format,
            data: await res.json()
        };
    }
}
