import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DirectionService {

    private readonly serviceUrl = 'https://wxs.ign.fr/essentiels/itineraire/rest/route.json?origin={{LON1}},{{LAT1}}&destination={{LON2}},{{LAT2}}&&method=DISTANCE&graphName=Pieton';

    public async getDirection(origin: number[], destination: number[]) {
        let url = this.serviceUrl
            .replace('{{LON1}}', origin[0].toString())
            .replace('{{LAT1}}', origin[1].toString())
            .replace('{{LON2}}', destination[0].toString())
            .replace('{{LAT2}}', destination[1].toString());

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return await res.json();
    }
}
