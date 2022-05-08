import { Injectable } from '@angular/core';

export interface DirectionProvider {
    name: string;
    url: string;
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
            url: 'https://wxs.ign.fr/essentiels/itineraire/rest/route.json?origin={{LON1}},{{LAT1}}&destination={{LON2}},{{LAT2}}&&method=DISTANCE&graphName=Pieton'
        },
        {
            name: 'geoapify',
            format: 'GeoJSON',
            url: 'https://api.geoapify.com/v1/routing?waypoints={{LAT1}},{{LON1}}|{{LAT2}},{{LON2}}&mode=bicycle&apiKey=1b48259b810e48ddb151889f9ea58db0'
        }
    ];

    public async getDirection(origin: number[], destination: number[], providerName: string): Promise<DirectionResult> {
        let provider = this.providers.find(p => p.name === providerName);
        if (provider == null) {
            throw new Error(`Direction provider ${providerName} not found`);
        }

        let url = provider.url
            .replace('{{LON1}}', origin[0].toString())
            .replace('{{LAT1}}', origin[1].toString())
            .replace('{{LON2}}', destination[0].toString())
            .replace('{{LAT2}}', destination[1].toString());

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
