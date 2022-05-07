import { Entity } from './entity';

export interface MapEntity extends Entity {
    name: string;
    maxZoom?: number;
    attributions: string;
    layers: Array<{
        type: 'raster' | 'vector' | string;
        url: string;
    }>;
}
