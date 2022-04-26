import { Storage } from '@ionic/storage-angular';

import SeedingData from '../../../seeding.json';
import { UUID } from '../utils/uuid';
import { EntityFactory } from './entity-factory';

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

        let newMap = EntityFactory.createMap(SeedingData.defaultMaps[3]);
        newMap.id = UUID.next();
        maps.splice(3, 0, newMap);

        await storage.set('maps', maps);
    },
    async storage => {
        await storage.remove('maps');
        await storage.remove('preferences');
    }
];
