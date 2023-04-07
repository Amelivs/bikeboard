import { Entity } from './entity';

export interface MapEntity extends Entity {
  name: string;
  maxZoom?: number | nil;
  attributions?: string | nil;
  layers: Array<{
    type: 'raster' | 'vector' | string;
    url: string;
  }>;
}
