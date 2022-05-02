import { MapEntity } from './entities/map';
import { PathEntity } from './entities/path';
import { PreferencesEntity } from './entities/settings';
import { Track } from './entities/track';

export class EntityFactory {
    static createMap(data: Omit<MapEntity, 'id'>): MapEntity {
        if (!data.name || !Array.isArray(data.layers) || data.layers.length === 0) {
            throw new Error('Missing required properties');
        }
        return {
            id: null,
            name: data.name,
            maxZoom: data.maxZoom ?? null,
            layers: data.layers.slice()
        };
    }

    static createPath(data: Omit<PathEntity, 'id'>): PathEntity {
        if (!data.name || !data.url) {
            throw new Error('Missing required properties');
        }
        return {
            id: null,
            name: data.name,
            url: data.url
        };
    }

    static createDefaultSettings(data: Partial<PreferencesEntity>): PreferencesEntity {
        return {
            activeMapId: data.activeMapId,
            activePathIds: data.activePathIds
        };
    }
}
