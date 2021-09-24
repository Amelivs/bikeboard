import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Layer, MapSettingsService } from 'src/app/core/services/map-settings.service';

@Injectable({
    providedIn: 'root'
})
export class MapSelectorService {

    private readonly $activeMap = new ReplaySubject<Layer>(1);

    constructor(private mapSettings: MapSettingsService) { }

    public readonly activeMap = this.$activeMap.asObservable();

    public async getAvailableMaps() {
        return await Promise.resolve(this.mapSettings.maps);
    }

    public async getActiveMap() {
        return await this.mapSettings.getMap();
    }

    public async setActiveMap(map: Layer) {
        await this.mapSettings.setMap(map);
        this.$activeMap.next(map);
    }
}
