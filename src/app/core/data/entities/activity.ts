import { Entity } from './entity';

export interface Activity extends Entity {
  startDate: Date;
  distance: number;
  duration: number;
  segments: ActivitySegment[];
}

export interface ActivitySegment {
  points: ActivityPoint[];
}

export interface ActivityPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  timestamp: number;
}
