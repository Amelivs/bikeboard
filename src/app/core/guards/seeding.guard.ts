import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { EntityFactory } from '../data/entity-factory';
import SeedingData from '../../../seeding.json';
import { DataContext } from '../data/data-context';
import { MapEntity } from '../data/entities/map';
import { PathEntity } from '../data/entities/path';
import { TrackingService } from '../services/tracking.service';

@Injectable({
    providedIn: 'root'
})
export class SeedingGuard implements CanActivate {

    constructor(private context: DataContext, private trackingService: TrackingService) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        try {
            await this.context.initialize();
            await this.trackingService.initialize();
            let maps = await this.seedMaps();
            let paths = await this.seedPaths();
            await this.seedSettings(maps, paths);
        }
        catch (err) {
            console.error(err);
        }
        return true;
    }

    private async seedMaps() {
        let existingMaps = await this.context.maps.get();
        if (existingMaps != null) {
            return [];
        }
        let maps = SeedingData.defaultMaps.map(m => EntityFactory.createMap(m));
        for (let map of maps) {
            await this.context.maps.save(map);
        }
        return maps;
    }

    private async seedPaths() {
        let existingPaths = await this.context.paths.get();
        if (existingPaths != null) {
            return [];
        }
        let paths = SeedingData.defaultPaths.map(p => EntityFactory.createPath(p));
        for (let path of paths) {
            await this.context.paths.save(path);
        }
        return paths;
    }

    private async seedSettings(maps: MapEntity[], paths: PathEntity[]) {
        let existingSettings = await this.context.preferences.get();
        if (existingSettings != null) {
            return;
        }
        await this.context.preferences.save(EntityFactory.createDefaultSettings({
            activeMapId: maps[0]?.id
        }));
    }
}
