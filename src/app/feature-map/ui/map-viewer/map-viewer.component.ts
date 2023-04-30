import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DirectionResult } from 'src/app/core/services/direction.service';
import maplibre, { AttributionControl } from 'maplibre-gl';
import { ReplaySubject, Subject, combineLatest, map, mergeMap, startWith, throttleTime } from 'rxjs';
import { Marker } from 'maplibre-gl';

import { LayerService } from '../../services/layer.service';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.scss']
})
export class MapViewerComponent implements OnInit {

  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLElement>;
  @ViewChild('positionMarker', { static: true }) positionMarkerElement!: ElementRef;

  @Input() markerDisabled = true;
  @Output() mapMove = new EventEmitter<void>();
  @Output() mapDblClick = new EventEmitter<void>();
  @Output() viewRotate = new EventEmitter<number>();
  @Output() context = new EventEmitter<number[]>();
  @Output() elevationAvailable = new EventEmitter<boolean>();

  constructor(private layerService: LayerService) { }

  private marker: maplibregl.Marker | nil;
  private map: maplibregl.Map | nil;
  private mapEntity$ = new ReplaySubject<MapEntity>(1);
  private pathEntities$ = new ReplaySubject<PathEntity[]>(1);
  private direction$ = new ReplaySubject<DirectionResult | nil>(1);
  private resizeObserver: ResizeObserver | nil;
  private readonly pointOverlays: Marker[] = [];
  private readonly points: number[][] = [];

  ngOnInit() {
    this.initializeMap(this.mapElement, this.positionMarkerElement);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  initializeMap(mapElement: ElementRef<HTMLElement>, markerElement: ElementRef<HTMLElement>) {
    if (this.map != null) throw new Error('Map is already initialized');

    this.map = new maplibre.Map({
      container: mapElement.nativeElement,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      zoom: 14,
      minZoom: 2,
      maxZoom: 20,
      attributionControl: false
    });

    this.map.scrollZoom.setWheelZoomRate(1);
    this.map.doubleClickZoom.disable();

    this.map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

    let zoomend$ = new Subject<any>();
    zoomend$.pipe(throttleTime(50, undefined, { leading: true, trailing: false }))
      .subscribe(() => {
        const zoom = Math.round(this.map!.getZoom());
        if (zoom !== this.map!.getZoom()) {
          this.map!.zoomTo(zoom, { duration: 50 });
        }
      });

    this.map.setZoom(Math.round(this.map.getZoom()));
    this.map.on('zoomend', ev => zoomend$.next(ev));

    this.map.on('rotate', event => {
      this.viewRotate.emit(event.target.getBearing() * Math.PI / -180);
    });

    this.map.on('mousedown', event => {
      this.mapMove.emit();
    });

    this.map.on('touchstart', event => {
      this.mapMove.emit();
    });

    this.map.on('dblclick', event => {
      this.mapDblClick.emit();
    });

    this.marker = new Marker(markerElement.nativeElement);

    let style$ = this.mapEntity$.pipe(mergeMap(map => fetch(map.styleUrl).then<maplibregl.StyleSpecification>(res => res.json())));
    let paths$ = this.pathEntities$.pipe(mergeMap((paths) => this.layerService.setPathLayers(paths)));
    let direction$ = this.direction$.pipe(map(direction => this.layerService.setDirectionLayer(direction))).pipe(startWith(null));

    combineLatest([style$, paths$, direction$])
      .subscribe(data => {
        let [style] = data;
        this.layerService.appendLayers(style);
        this.elevationAvailable.emit(style.sources['elevation'] != null);
        // Reset terrain before switching style to avoid map drag and zoom issues.
        this.map?.setTerrain(null as any);
        this.map!.setStyle(style);
      });
  }

  setPosition(position: number[]): void {
    if (this.marker == null || this.map == null) return;
    let currentPosition = this.marker.getLngLat();
    this.marker.setLngLat([position[0], position[1]]);
    this.map.setCenter([position[0], position[1]]);
    if (currentPosition == null) {
      this.marker.addTo(this.map);
    }
  }

  setPoints(points: number[][] | null): void {
    this.pointOverlays.forEach(po => po.remove());
    this.points.length = 0;
    this.pointOverlays.length = 0;

    if (points == null) {
      return;
    }

    for (let point of points) {
      this.points.push(point);
      let element = document.createElement('ion-icon');
      element.setAttribute('name', 'location');
      element.className = 'app-overlay-waypoint';

      let overlay = new Marker({ element, anchor: 'bottom' });
      overlay.setLngLat([point[0], point[1]]);
      this.pointOverlays.push(overlay);
      overlay.addTo(this.map!);
    }
  }

  getPoints(): number[][] {
    return this.points;
  }

  setXyzSources(map: MapEntity): void {
    this.mapEntity$.next(map);
  }

  setGpxSources(sources: PathEntity[]): void {
    this.pathEntities$.next(sources);
  }

  getPosition(): number[] {
    if (this.marker == null) throw new Error('Marker not initialized');
    return this.marker.getLngLat().toArray();
  }

  setZoom(zoom: number) {
    this.map?.setZoom(zoom);
  }

  setRotation(rotation: number, animate = false) {
    if (animate) {
      this.map?.rotateTo(rotation);
    }
    else {
      this.map?.setBearing(rotation);
    }
  }

  toggleElevation() {
    if (this.map!.getTerrain() == null) {
      if (this.map!.getSource('elevation') != null) {
        this.map?.setTerrain({
          source: 'elevation',
          exaggeration: 1.5,
        });
      }
    }
    else {
      this.map?.setTerrain(null as any);
    }
  }

  setDirection(direction: DirectionResult | nil): void {
    this.direction$.next(direction);
  }

  onLongPress(event: MouseEvent | TouchEvent): void {
    let pixelCoords: [number, number];
    if (event instanceof MouseEvent) {
      pixelCoords = [event.x, event.y];
    }
    else {
      let touch = event.touches.item(0);
      if (touch == null) return;
      pixelCoords = [touch.clientX, touch.clientY];
    }
    let geoCoords = this.map!.unproject(pixelCoords);
    this.context.emit([geoCoords.lng, geoCoords.lat]);
  }

  resize() {
    if (this.map == null) return;
    this.map.resize();
  }
}
