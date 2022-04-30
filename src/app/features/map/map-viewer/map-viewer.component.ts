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
import GPX from 'ol/format/GPX';
import XYZ from 'ol/source/XYZ';
import BaseLayer from 'ol/layer/Base';
import TileDebug from 'ol/source/TileDebug';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import MapboxVector from 'ol/layer/MapboxVector';


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
    controls: [new ScaleLine(), new Rotate({ autoHide: false })],
    interactions: defaultInteractions({ doubleClickZoom: false })
  });

  private readonly layers = new LayerGroup();
  private readonly gpxLayers = new LayerGroup();
  private readonly wktLayers = new LayerGroup();

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

  constructor(private zone: NgZone) { }

  public ngOnInit() {
    this.map.setView(this.view);
    this.map.addLayer(this.layers);
    this.map.addLayer(this.gpxLayers);
    this.map.addLayer(this.wktLayers);
    this.map.addOverlay(this.positionMarker);
    this.map.on('pointerdrag', () => this.zone.run(() => this.onMapDrag()));
    this.map.on('dblclick', () => this.zone.run(() => this.onMapDblClick()));
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

  public setRotation(rotation: number) {
    this.view.setRotation(rotation);
  }

  public setXyzSources(map: MapEntity) {
    let layers = map.layers.map(layer => {
      if (layer.type === 'raster') {
        this.view.setConstrainResolution(true);
        let tilePixelRatio = this.getDevicePixelRatio();
        let tileSize = Math.round(256 / tilePixelRatio);
        return new TileLayer({
          source: new XYZ({
            crossOrigin: 'anonymous',
            url: layer.url,
            opaque: false,
            tilePixelRatio,
            tileSize
          })
        });
      }
      else if (layer.type === 'vector') {
        this.view.setConstrainResolution(false);
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

  public setWkt(wkt: string) {
    let layers: BaseLayer[] = [];

    if (wkt == null) {
      this.wktLayers.setLayers(new Collection(layers));
      return;
    }

    const format = new WKT();

    const feature = format.readFeature(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    const vector = new VectorLayer({
      source: new VectorSource({
        features: [feature],
      }),
      style: feature => this.gpxStyle[feature.getGeometry().getType()],
    });

    layers.push(vector);
    this.wktLayers.setLayers(new Collection(layers));
  }

  public getBoundingBoxTileUrls(zoom = 15) {
    let layer = this.layers.getLayers().getArray()[0] as TileLayer<TileDebug>;
    let source = layer.getSource();
    let tileGrid = source.getTileGrid();
    let urlFunc = source.getTileUrlFunction();
    let tileURLs = [];
    let extent = this.view.calculateExtent(this.map.getSize());
    tileGrid.forEachTileCoord(extent, zoom, function (tileCoord) {
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
