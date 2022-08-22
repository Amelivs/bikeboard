import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import SeedingData from '../../../seeding.json';
import { DataContext } from '../data/data-context';
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
      await this.seedMaps();
      await this.seedPaths();
      await this.seedSettings();
    }
    catch (err) {
      console.error(err);
    }
    return true;
  }

  private async seedMaps() {
    let existingMaps = await this.context.maps.getAll();
    if (existingMaps.length > 0) {
      return;
    }
    for (let map of SeedingData.defaultMaps) {
      await this.context.maps.save(map);
    }
  }

  private async seedPaths() {
    let existingPaths = await this.context.paths.getAll();
    if (existingPaths.length > 0) {
      return;
    }
    for (let path of SeedingData.defaultPaths) {
      await this.context.paths.save(path);
    }
  }

  private async seedSettings() {
    if (!this.context.preferences.get<string>('activeMapId')) {
      await this.context.preferences.save('activeMapId', SeedingData.defaultMaps[0]?.id);
    }
    if (!this.context.preferences.get<string[]>('activePathIds')) {
      await this.context.preferences.save('activePathIds', []);
    }
  }
}
