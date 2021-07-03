import { Injectable } from "@angular/core";
import { Storage } from '@ionic/storage-angular';


export interface Layer {
    id: string, name: string, sourceUrl: string
}

export enum NavigationMode { LiveOrientation, FixedOrientation };

@Injectable({ providedIn: 'root' })
export class MapSettingsService {

    readonly maps: Array<Layer> = [
        { id: 'openstreetmap', name: 'OpenStreetMap', sourceUrl: 'https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png' },
        { id: 'cyclosm', name: 'CyclOSM', sourceUrl: 'https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png' }
    ];

    readonly paths: Array<Layer> = [
        { id: 'ev5', name: 'EuroVelo 5', sourceUrl: 'assets/gpx/EuroVelo-5.gpx' },
        { id: 'ev6', name: 'EuroVelo 6', sourceUrl: 'assets/gpx/EuroVelo-6.gpx' },
        { id: 'ev15', name: 'EuroVelo 15', sourceUrl: 'assets/gpx/EuroVelo-15.gpx' }
    ];

    readonly defaultTrackingDuration = 5;
    readonly defaultNavigationMode = NavigationMode.LiveOrientation;

    private _storage: Promise<Storage>;

    constructor(private storage: Storage) {
        this._storage = this.storage.create();
    }

    async getMap() {
        let storage = await this._storage;
        var mapId: string = await storage.get('MapSettings.mapId');
        var map = this.maps.find(m => m.id === mapId);
        if (map == null) {
            return this.maps[0];
        }
        return map;
    }

    async setMap(map: Layer) {
        let storage = await this._storage;
        await storage.set('MapSettings.mapId', map.id);
    }

    async getPaths() {
        let storage = await this._storage;
        var pathIds: Array<string> = await storage.get('MapSettings.pathIds');
        if (pathIds == null) {
            return [];
        }
        var paths = this.paths.filter(p => pathIds.indexOf(p.id) > -1);
        return paths;
    }

    async setPaths(paths: Layer[]) {
        let storage = await this._storage;
        await storage.set('MapSettings.pathIds', paths.map(p => p.id));
    }

    async setTrackingDuration(duration: number) {
        let storage = await this._storage;
        await storage.set('MapSettings.trackingDuration', duration);
    }

    async getTrackingDuration() {
        let storage = await this._storage;
        var value: number = await storage.get("MapSettings.trackingDuration");
        if (value == null) {
            value = this.defaultTrackingDuration;
        }
        return value;
    }

    async getMode() {
        let storage = await this._storage;
        var value: NavigationMode = await storage.get("MapSettings.navigationMode");
        if (value == null) {
            value = this.defaultNavigationMode;
        }
        return value;
    }

    async setMode(mode: NavigationMode) {
        let storage = await this._storage;
        await storage.set('MapSettings.navigationMode', mode);
    }
}