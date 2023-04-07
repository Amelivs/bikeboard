import { Storage } from '@ionic/storage-angular';
import { firstValueFrom, Subject } from 'rxjs';

import SeedingData from '../../../seeding.json';
import { UUID } from '../utils/uuid';
import { MapEntity } from './entities/map';
import { PreferencesEntity } from './entities/settings';
import { Activity } from './entities/activity';
import { DistanceUtil } from '../utils/distance';

export type MigrationStep = (storage: Storage, db: IDBDatabase) => Promise<void>;

export const MigrationSteps: ReadonlyArray<MigrationStep> = [
  async storage => {
    let maps = await storage.get('maps');
    if (!Array.isArray(maps)) {
      return;
    }
    for (let map of maps) {
      map.layers = map.wmtsUrls?.map((url: any) => ({
        type: 'raster',
        url
      }));
      delete map.wmtsUrls;
    }

    let newMap = SeedingData.defaultMaps[3];
    newMap.id = UUID.next();
    maps.splice(3, 0, newMap);

    await storage.set('maps', maps);
  },
  async storage => {
    await storage.remove('maps');
    await storage.remove('preferences');
  },
  async storage => {
    let currentTrack = await storage.get('currentTrack');
    if (currentTrack == null) {
      return;
    }
    let track: Activity = {
      id: null!,
      startDate: null!,
      distance: null!,
      duration: null!,
      segments: [{ points: currentTrack.points }]
    };
    await storage.set('currentTrack', track);
  },
  async storage => {
    await storage.remove('maps');
    await storage.remove('preferences');
  },
  async storage => {
    await storage.remove('maps');
    await storage.remove('paths');
    await storage.remove('preferences');
  },
  async storage => { },
  async storage => {
    let maps = await storage.get('maps') as any[];
    let map = maps?.find(m => m.id === '00000000-0000-0000-0000-05548b4a86f9');
    if (map == null) {
      return;
    }
    let layer = map?.layers[0];
    if (layer == null) {
      return;
    }
    layer.url = 'assets/maps/plan_ign.json';
    await storage.set('maps', maps);
  },
  async (storage, db) => {
    let result$ = new Subject<void>();

    let maps: Array<MapEntity> = await storage.get('maps');
    let paths: Array<MapEntity> = await storage.get('paths');
    let preferences: PreferencesEntity = await storage.get('preferences');
    let position: PreferencesEntity = await storage.get('position');
    let track: Activity = await storage.get('currentTrack');

    let transaction = db.transaction(['maps', 'paths', 'preferences', 'activities', 'version'], 'readwrite');

    if (maps != null) {
      let mapsStore = transaction.objectStore('maps');
      for (let map of maps) {
        mapsStore.put(map);
      }
    }
    if (paths != null) {
      let pathsStore = transaction.objectStore('paths');
      for (let path of paths) {
        pathsStore.put(path);
      }
    }
    let preferencesStore = transaction.objectStore('preferences');
    if (preferences != null) {
      preferencesStore.put(preferences.activeMapId, 'activeMapId');
      preferencesStore.put(preferences.activePathIds, 'activePathIds');
    }
    if (position != null) {
      preferencesStore.put(position, 'position');
    }
    if (track != null) {
      track.id = 'currentActivity';
      transaction.objectStore('activities').put(track);
    }

    transaction.oncomplete = () => {
      result$.next();
    };

    transaction.onerror = () => {
      result$.error(transaction.error);
    };

    return firstValueFrom(result$);
  },
  async (storage, db) => {
    let result$ = new Subject<void>();

    let transaction = db.transaction(['activities', 'preferences'], 'readwrite');
    let activityStore = transaction.objectStore('activities');
    let preferencesStore = transaction.objectStore('preferences');

    let getRequest = activityStore.get('currentActivity');
    getRequest.onsuccess = () => {
      let activity: Activity = getRequest.result;
      if (activity == null) {
        return;
      }

      activity.id = UUID.next();
      let timestamp = activity.segments[0]?.points[0]?.timestamp;
      if (!isNaN(timestamp) && timestamp !== Infinity) {
        activity.startDate = new Date(timestamp);
      }
      else {
        activity.startDate = new Date();
      }
      activity.distance = DistanceUtil.getDistance(activity);
      activity.duration = DistanceUtil.getDuration(activity);

      activityStore.put(activity).onsuccess = () => {
        preferencesStore.put(activity.id, 'currentActivityId').onsuccess = () => {
          activityStore.delete('currentActivity');
        };
      };
    };

    transaction.oncomplete = () => {
      result$.next();
    };

    transaction.onerror = () => {
      result$.error(transaction.error);
    };

    return firstValueFrom(result$);
  },
  async (storage, db) => {
    let result$ = new Subject<void>();

    let transaction = db.transaction(['activities'], 'readwrite');
    let activityStore = transaction.objectStore('activities');

    let getRequest = activityStore.getAll();
    getRequest.onsuccess = () => {
      let activities: Activity[] = getRequest.result;
      if (activities == null) {
        return;
      }
      for (let activity of activities) {
        activity.duration = DistanceUtil.getDuration(activity);
        activityStore.put(activity);
      }
    };

    transaction.oncomplete = () => {
      result$.next();
    };

    transaction.onerror = () => {
      result$.error(transaction.error);
    };

    return firstValueFrom(result$);
  }
];
