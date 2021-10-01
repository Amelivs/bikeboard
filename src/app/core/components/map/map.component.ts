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
import { Layer } from '../../services/map-settings.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {

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
    constrainResolution: true,
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

  public setXyzSources(sources: string[], maxZoom = 18) {
    let layers = sources.map(url => new TileLayer({
      source: new XYZ({
        crossOrigin: 'anonymous',
        url,
        opaque: false
      })
    }));
    this.layers.setLayers(new Collection(layers));
    this.view.setMaxZoom(maxZoom);
  }

  public setGpxSources(sources: Layer[]) {
    let layers: BaseLayer[] = [];
    for (let path of sources) {
      let layer = new VectorLayer({
        source: new VectorSource({
          url: path.sourceUrls[0],
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
    let layer = this.layers.getLayers().getArray()[0] as TileLayer;
    let source = layer.getSource();
    let tileGrid = source.getTileGrid();
    let urlFunc = (source as TileDebug).getTileUrlFunction();
    let tileURLs = [];
    let extent = this.view.calculateExtent(this.map.getSize());
    tileGrid.forEachTileCoord(extent, zoom, function(tileCoord) {
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
}
