import { Entity } from './entity';

export interface MapEntity extends Entity {
    name: string;
    maxZoom?: number;
    wmtsUrls: string[];
}

