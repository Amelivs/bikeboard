import { Storage } from '@ionic/storage-angular';

import SeedingData from '../../../seeding.json';
import { UUID } from '../utils/uuid';
import { Track } from './entities/track';

export const MigrationSteps: ReadonlyArray<(storage: Storage) => Promise<void>> = [
    async storage => {
        let maps = await storage.get('maps');
        if (!Array.isArray(maps)) {
            return;
        }
        for (let map of maps) {
            map.layers = map.wmtsUrls?.map(url => ({
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
        let track: Track = {
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
    }
];
