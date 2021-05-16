import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';

import { Map, Overlay, View, Geolocation } from 'ol';
import { fromLonLat } from 'ol/proj';
import OverlayPositioning from 'ol/OverlayPositioning';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GPX from 'ol/format/GPX';
import { Style, Stroke } from 'ol/style';
import { Coordinate } from 'ol/coordinate';


type TrackingMode = 'Free' | 'Centered';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements AfterViewInit {

  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('positionMarker') positionMarkerElement: ElementRef;

  private view: View;
  private map: Map;
  private positionMarker: Overlay;
  private geolocation: Geolocation;

  public mode: TrackingMode = 'Free';

  public get navIcon() {
    return this.geolocation?.getTracking() ? 'navigate' : 'navigate-outline';
  }

  constructor(private zone: NgZone) {  }

  ngAfterViewInit() {
    this.view = new View({
      center: [843853.0918941167 + 1000, 6039219.2160023255],
      constrainResolution: true,
      zoom: 17,
      minZoom: 8,
      maxZoom: 18,
      rotation: 0
    })

    this.geolocation = new Geolocation({
      projection: this.view.getProjection(),
      tracking: false,
      trackingOptions: {
        enableHighAccuracy: true,
        maximumAge: 6000
      }
    });

    this.geolocation.on('change:position', () => this.onPositionChange());
    this.geolocation.on('change:heading', () => this.onHeadingChange());

    this.positionMarker = new Overlay({
      position: fromLonLat([0, 0]),
      positioning: OverlayPositioning.CENTER_CENTER,
      element: this.positionMarkerElement.nativeElement,
      stopEvent: false,
    });

    var style = {
      'MultiLineString': new Style({
        stroke: new Stroke({
          color: 'rgba(0,49,148,0.7)',
          width: 6,
        }),
      }),
    };

    var ev15 = new VectorLayer({
      source: new VectorSource({
        url: 'assets/gpx/EuroVelo-5.gpx',
        format: new GPX(),
      }),
      style: function (feature) {
        return style[feature.getGeometry().getType()];
      },
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      controls: [],
      layers: [
        new TileLayer({
          //source: new OSM({ url: 'https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png' }),
          source: new OSM({ url: 'https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png' })
        }),
      //  ev15
      ],
      view: this.view,
      overlays: [this.positionMarker]
    });

    this.map.on("pointerdrag", () => this.zone.run(() => this.onMove()));

    setTimeout(() => {
      this.map.updateSize();
    }, 500);

    this.navigateClick();
  }

  private trackingTimeout: any;

  public navigateClick() {
    if (this.geolocation.getTracking()) {
      clearTimeout(this.trackingTimeout);
      this.geolocation.setTracking(false);
    }
    else {
      this.centerClick();
      this.geolocation.setTracking(true);
      this.trackingTimeout = setTimeout(() => {
        this.geolocation.setTracking(false);
      }, 8 * 60 * 1000);
    }
  }

  public centerClick() {
    var lastPosition = this.positionMarker.getPosition();
    this.view.setCenter(lastPosition);
    this.mode = 'Centered';
  }

  private onPositionChange() {
    var coordinates = this.geolocation.getPosition();
    this.positionMarker.setPosition(coordinates);
    if (this.mode === 'Centered') {
      this.view.setCenter(coordinates);
    }
  }

  private onHeadingChange() {
    var heading = this.geolocation.getHeading();
    if (this.mode === 'Centered') {
      this.view.setRotation(-heading);
    }
  }

  private onMove() {
    this.mode = 'Free';
  }
}
