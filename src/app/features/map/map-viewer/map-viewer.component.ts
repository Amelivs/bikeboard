import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { Map, Overlay, View, Collection } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Stroke } from 'ol/style';
import { ScaleLine, Rotate, } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import OverlayPositioning from 'ol/OverlayPositioning';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import GeoJSON from 'ol/format/GeoJSON';
import GPX from 'ol/format/GPX';
import XYZ from 'ol/source/XYZ';
import BaseLayer from 'ol/layer/Base';
import TileDebug from 'ol/source/TileDebug';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import MapboxVector from 'ol/layer/MapboxVector';
import { DirectionResult } from 'src/app/core/services/direction.service';
import { ReadOptions } from 'ol/format/Feature';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';


@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.scss']
})
export class MapViewerComponent implements OnInit, AfterViewInit {

  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('positionMarker') positionMarkerElement: ElementRef;

  @Input() markerDisabled = true;
  @Output() mapMove = new EventEmitter<void>();
  @Output() mapDblClick = new EventEmitter<void>();
  @Output() viewRotate = new EventEmitter<number>();
  @Output() context = new EventEmitter<number[]>();

  private readonly positionMarker = new Overlay({
    positioning: OverlayPositioning.CENTER_CENTER,
    stopEvent: false,
  });

  private readonly view = new View({
    constrainRotation: false,
    zoom: 14,
    minZoom: 4,
    maxZoom: 18,
    rotation: 0
  });

  private readonly map = new Map({
    controls: [new ScaleLine()],
    interactions: defaultInteractions({ doubleClickZoom: false })
  });

  private readonly layers = new LayerGroup();
  private readonly gpxLayers = new LayerGroup();
  private readonly directionLayers = new LayerGroup();

  private readonly gpxStyle = {
    MultiLineString: new Style({
      stroke: new Stroke({
        color: 'rgba(205, 61, 0, 0.8)',
        width: 8,
      }),
    }),
    LineString: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 50, 120, 0.8)',
        width: 8,
      }),
    }),
  };

  private resizeObserver = new ResizeObserver(() => this.onResize());

  private onMapDrag() {
    this.mapMove.emit();
  }

  private onMapDblClick() {
    this.mapDblClick.emit();
  }

  private onResize() {
    this.map.updateSize();
  }

  private onViewRotate() {
    this.viewRotate.emit(this.view.getRotation());
  }

  constructor(private zone: NgZone) { }

  public ngOnInit() {
    this.map.setView(this.view);
    this.map.addLayer(this.layers);
    this.map.addLayer(this.gpxLayers);
    this.map.addLayer(this.directionLayers);
    this.map.addOverlay(this.positionMarker);
    this.map.on('pointerdrag', () => this.zone.run(() => this.onMapDrag()));
    this.map.on('dblclick', () => this.zone.run(() => this.onMapDblClick()));
    this.view.on('change:rotation', () => this.zone.run(() => this.onViewRotate()));
  }

  public ngAfterViewInit() {
    this.map.setTarget(this.mapElement.nativeElement);
    this.positionMarker.setElement(this.positionMarkerElement.nativeElement);
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  public getPosition() {
    return this.positionMarker.getPosition();
  }

  public getGeographicPosition() {
    let coordinates = this.positionMarker.getPosition();
    return toLonLat(coordinates, this.view.getProjection());
  }

  public setPosition(position: number[]) {
    let projectedPosition = fromLonLat(position, this.view.getProjection());
    this.view.setCenter(projectedPosition);
    this.positionMarker.setPosition(projectedPosition);
  }

  public setCenter(position: number[]) {
    let projectedPosition = fromLonLat(position, this.view.getProjection());
    this.view.setCenter(projectedPosition);
  }

  public setZoom(zoom: number) {
    this.view.setZoom(zoom);
  }

  public setRotation(rotation: number, animate = false) {
    animate ?
      this.view.animate({ rotation, duration: 300 }) :
      this.view.setRotation(rotation);
  }

  public setXyzSources(map: MapEntity) {
    let layers = map.layers.map(layer => {
      if (layer.type === 'raster') {
        this.view.setConstrainResolution(true);
        return new TileLayer({
          source: new XYZ({
            crossOrigin: 'anonymous',
            url: layer.url,
            opaque: false
          })
        });
      }
      else if (layer.type === 'vector') {
        this.view.setConstrainResolution(true);
        return new MapboxVector({
          styleUrl: layer.url
        });
      }
      throw new Error(`Unknown layer type '${layer.type}'`);
    });

    this.layers.setLayers(new Collection(layers));
    this.view.setMaxZoom(map.maxZoom ?? 18);
  }

  public setGpxSources(sources: PathEntity[]) {
    let layers: BaseLayer[] = [];
    for (let path of sources) {
      let layer = new VectorLayer({
        source: new VectorSource({
          url: path.url,
          format: new GPX(),
        }),
        style: feature => this.gpxStyle[feature.getGeometry().getType()],
      });
      layers.push(layer);
    }
    this.gpxLayers.setLayers(new Collection(layers));
  }

  public setDirection(direction: DirectionResult) {
    let layers: BaseLayer[] = [];

    if (direction == null) {
      this.directionLayers.setLayers(new Collection(layers));
      return;
    }

    let features: Feature<Geometry>[];
    let options: ReadOptions = {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    };

    if (direction.format === 'WKT') {
      let format = new WKT();
      let source = direction.data['geometryWkt'];
      features = format.readFeatures(source, options);
    }
    else if (direction.format === 'GeoJSON') {
      let format = new GeoJSON();
      let source = direction.data;
      features = format.readFeatures(source, options);
    }
    else {
      throw new Error(`Unsupported direction format '${direction.format}'`);
    }

    const vector = new VectorLayer({
      source: new VectorSource({
        features,
      }),
      style: feature => this.gpxStyle[feature.getGeometry().getType()],
    });

    layers.push(vector);
    this.directionLayers.setLayers(new Collection(layers));
  }

  public getBoundingBoxTileUrls(zoom = 15) {
    let layer = this.layers.getLayers().getArray()[0] as TileLayer<TileDebug>;
    let source = layer.getSource();
    let tileGrid = source.getTileGrid();
    let urlFunc = source.getTileUrlFunction();
    let tileURLs = [];
    let extent = this.view.calculateExtent(this.map.getSize());
    tileGrid.forEachTileCoord(extent, zoom, tileCoord => {
      let url = urlFunc(tileCoord, 1, source.getProjection());
      tileURLs.push(url);
    });
    return tileURLs;
  }

  public onLongPress(event: MouseEvent | TouchEvent) {
    let pixelCoords: number[];
    if (event instanceof MouseEvent) {
      pixelCoords = [event.x, event.y];
    }
    else {
      pixelCoords = [event.touches.item(0).clientX, event.touches.item(0).clientY];
    }
    let coordinates = this.map.getCoordinateFromPixel(pixelCoords);
    let geoCoords = toLonLat(coordinates, this.view.getProjection());
    this.context.emit(geoCoords);
  }

  private getDevicePixelRatio() {
    let mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5),(min-resolution: 1.5dppx)';
    if (window.devicePixelRatio > 1) {
      return 2;
    }
    if (window.matchMedia && window.matchMedia(mediaQuery).matches) {
      return 2;
    }
    return 1;
  }
}
