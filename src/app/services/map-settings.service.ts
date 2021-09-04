import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';


export interface Layer {
    id: string; name: string; sourceUrls: string[]; maxZoom?: number;
}

export enum NavigationMode { LiveOrientation, FixedOrientation };

@Injectable({ providedIn: 'root' })
export class MapSettingsService {

    buildUrl(base: string, params: { [key: string]: string }) {
        let url = new URL(base);
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }
        return url.href.replace('TILE_X', '{x}').replace('TILE_ZOOM', '{z}').replace('TILE_Y', '{y}');
    }

    readonly maps: Array<Layer> = [
        { id: 'openstreetmap', name: 'OpenStreetMap', sourceUrls: ['https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'] },
        { id: 'cyclosm', name: 'CyclOSM', sourceUrls: ['https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'] },
        {
            id: 'planign', name: 'Plan IGN', sourceUrls: [
                this.buildUrl('https://wxs.ign.fr/decouverte/geoportail/wmts', {
                    layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
                    style: 'normal',
                    tilematrixset: 'PM',
                    Service: 'WMTS',
                    Request: 'GetTile',
                    Version: '1.0.0',
                    Format: 'image/png',
                    TileMatrix: 'TILE_ZOOM',
                    TileCol: 'TILE_X',
                    TileRow: 'TILE_Y'
                }),
            ]
        },
        { id: 'ignscan25', name: 'Plan IGN Rando', maxZoom: 16, sourceUrls: ['https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}'] },
        { id: 'ignaerien', name: 'Plan IGN aérien', sourceUrls: ['https://wxs.ign.fr/decouverte/geoportail/wmts?gp-ol-ext=3.1.0&layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}'] },
        {
            id: 'cadastre', name: 'Cadastre', sourceUrls: [
                'https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                'https://wxs.ign.fr/parcellaire/geoportail/wmts?layer=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&style=PCI%20vecteur&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}'
            ]
        },
        {
            id: 'drone', name: 'Zones de restrictions pour drones', sourceUrls: [
                'https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                'https://wxs.ign.fr/transports/geoportail/wmts?layer=TRANSPORTS.DRONES.RESTRICTIONS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}'
            ]
        }
    ];

    readonly paths: Array<Layer> = [
        { id: 'ev5', name: 'EuroVelo 5', sourceUrls: ['assets/gpx/EuroVelo-5.gpx'] },
        { id: 'ev6', name: 'EuroVelo 6', sourceUrls: ['assets/gpx/EuroVelo-6.gpx'] },
        { id: 'ev15', name: 'EuroVelo 15', sourceUrls: ['assets/gpx/EuroVelo-15.gpx'] }
    ];

    readonly defaultTrackingDuration = 5;
    readonly defaultNavigationMode = NavigationMode.LiveOrientation;

    private _storage: Promise<Storage>;

    constructor(private storage: Storage) {
        this._storage = this.storage.create();
    }

    async getMap() {
        let storage = await this._storage;
        let mapId: string = await storage.get('MapSettings.mapId');
        let map = this.maps.find(m => m.id === mapId);
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
        let pathIds: Array<string> = await storage.get('MapSettings.pathIds');
        if (pathIds == null) {
            return [];
        }
        let paths = this.paths.filter(p => pathIds.indexOf(p.id) > -1);
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
        let value: number = await storage.get('MapSettings.trackingDuration');
        if (value == null) {
            value = this.defaultTrackingDuration;
        }
        return value;
    }

    async getMode() {
        let storage = await this._storage;
        let value: NavigationMode = await storage.get('MapSettings.navigationMode');
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
