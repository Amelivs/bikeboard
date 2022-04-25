import { Entity } from './entity';

export interface MapEntity extends Entity {
    name: string;
    maxZoom?: number;
    layers: Array<{
        type: 'raster' | 'vector' | string;
        url: string;
    }>;
}
