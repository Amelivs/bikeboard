import { inject } from '@angular/core';

import SeedingData from '../../../seeding.json';
import { DataContext } from '../data/data-context';
import { TrackingService } from '../services/tracking.service';
import { DialogService } from '../services/dialog.service';
import { LoggingService } from '../services/logging.service';


export const seedingGuard = async () => {
  const context = inject(DataContext);
  const trackingService = inject(TrackingService)
  const dialogSrv = inject(DialogService)
  const loggingSrv = inject(LoggingService)

  try {
    await context.initialize();
    await trackingService.initialize();
    await seedMaps(context);
    await seedPaths(context);
    await seedSettings(context);
  }
  catch (err) {
    loggingSrv.error(err);
    dialogSrv.alert(err);
  }
  return true;
}

const seedMaps = async (context: DataContext) => {
  let existingMaps = await context.maps.getAll();
  if (existingMaps.length > 0) {
    return;
  }
  for (let map of SeedingData.defaultMaps) {
    await context.maps.save(map);
  }
}

const seedPaths = async (context: DataContext) => {
  let existingPaths = await context.paths.getAll();
  if (existingPaths.length > 0) {
    return;
  }
  for (let path of SeedingData.defaultPaths) {
    await context.paths.save(path);
  }
}

const seedSettings = async (context: DataContext) => {
  if (!context.preferences.get<string>('activeMapId')) {
    await context.preferences.save('activeMapId', SeedingData.defaultMaps[0]?.id);
  }
  if (!context.preferences.get<string[]>('activePathIds')) {
    await context.preferences.save('activePathIds', []);
  }
}
