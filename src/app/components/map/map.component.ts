/// <reference types="resize-observer-browser" />
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { Map, Overlay, View, Collection } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke } from 'ol/style';
import { ScaleLine, Rotate, } from 'ol/control';
import OverlayPositioning from 'ol/OverlayPositioning';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import VectorSource from 'ol/source/Vector';
import GPX from 'ol/format/GPX';
import XYZ from 'ol/source/XYZ';
import BaseLayer from 'ol/layer/Base';
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
    controls: [new ScaleLine(), new Rotate({ autoHide: false })]
  });

  private readonly layers = new LayerGroup();
  private readonly gpxLayers = new LayerGroup();

  private readonly gpxStyle = {
    MultiLineString: new Style({
      stroke: new Stroke({
        color: 'rgba(205, 61, 0, 0.8)',
        width: 8,
      }),
    }),
  };

  private resizeObserver = new ResizeObserver(() => this.onResize());

  private onMapDrag() {
    this.mapMove.emit();
  }

  private onResize() {
    this.map.updateSize();
  }

  constructor(private zone: NgZone) { }

  public ngOnInit() {
    this.map.setView(this.view);
    this.map.addLayer(this.layers);
    this.map.addLayer(this.gpxLayers);
    this.map.addOverlay(this.positionMarker);
    this.map.on('pointerdrag', () => this.zone.run(() => this.onMapDrag()));
  }

  public ngAfterViewInit() {
    this.map.setTarget(this.mapElement.nativeElement);
    this.positionMarker.setElement(this.positionMarkerElement.nativeElement);
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  public getPosition() {
    return this.positionMarker.getPosition();
  }

  public setPosition(position: number[]) {
    var projectedPosition = fromLonLat(position, this.view.getProjection());
    this.view.setCenter(projectedPosition);
    this.positionMarker.setPosition(projectedPosition);
  }

  public setCenter(position: number[]) {
    var projectedPosition = fromLonLat(position, this.view.getProjection());
    this.view.setCenter(projectedPosition);
  }

  public setZoom(zoom: number) {
    this.view.setZoom(zoom);
  }

  public setRotation(rotation: number) {
    this.view.setRotation(rotation);
  }

  public setXyzSources(sources: string[]) {
    var layers = sources.map(url => new TileLayer({
      source: new XYZ({
        url,
        opaque: false
      })
    }));
    this.layers.setLayers(new Collection(layers));
  }

  public setGpxSources(sources: Layer[]) {
    var layers: BaseLayer[] = [];
    for (let path of sources) {
      let layer = new VectorLayer({
        source: new VectorSource({
          url: path.sourceUrls[0],
          format: new GPX(),
        }),
        style: feature => {
          return this.gpxStyle[feature.getGeometry().getType()];
        },
      });
      layers.push(layer);
    }

    this.gpxLayers.setLayers(new Collection(layers));
  }
}