import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DirectionResult } from 'src/app/core/services/direction.service';


export interface MapViewer {
  getPosition(): number[];
  getGeographicPosition(): number[];
  setPosition(position: number[]): void;
  setCenter(position: number[]): void;
  setAccuracy(position: number[], accuracy: number): void;
  setZoom(zoom: number): void;
  setRotation(rotation: number, animate?: boolean): void;
  setPoints(points: number[][] | null): void;
  getPoints(): number[][];
  setXyzSources(map: MapEntity): void;
  setGpxSources(sources: PathEntity[]): void;
  setDirection(direction: DirectionResult | null): void;
  getBoundingBoxTileUrls(zoom?: number): string[];
  onLongPress(event: MouseEvent | TouchEvent): void;
}
