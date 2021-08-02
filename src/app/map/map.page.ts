import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Map, Overlay, View, Collection } from 'ol';
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
import { ScaleLine, Rotate, } from 'ol/control';
import LayerGroup from 'ol/layer/Group';

import { MapSettingsComponent } from '../map-settings/map-settings.component';
import { MapSettingsService, NavigationMode } from '../services/map-settings.service';
import { NavigationService } from '../services/navigation.service';

type TrackingMode = 'Free' | 'Centered' | 'Navigation';

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
  private readonly initialPosition = [7.360836658509982, 48.07617984027771];
  private source = new OSM();
  private trackingDuration: number;
  private navigationMode: NavigationMode;
  private layergroup = new LayerGroup();
  private positionMarker: Overlay;

  public trackingMode: TrackingMode = 'Free';

  public get navIcon() {
    if (this.trackingMode === 'Free') {
      return 'navigate-outline';
    }
    if (this.trackingMode === 'Centered') {
      return 'navigate';
    }
    if (this.trackingMode === 'Navigation') {
      return 'compass';
    }
  }

  public get isTracking() {
    return this.navService.getTracking();
  }

  constructor(private zone: NgZone, public modalController: ModalController, private mapSettings: MapSettingsService, private navService: NavigationService) {
    this.navService.position.subscribe(position => this.onPositionChange(position), err => { this.onError(err) });
    this.navService.rotation.subscribe(rotation => this.onRotationChange(rotation), err => { this.onError(err) });
  }

  private async loadSettings() {
    var selectedMap = await this.mapSettings.getMap();
    this.source.setUrl(selectedMap.sourceUrl);
    this.trackingDuration = await this.mapSettings.getTrackingDuration();
    this.navigationMode = await this.mapSettings.getMode();

    var style = {
      'MultiLineString': new Style({
        stroke: new Stroke({
          color: 'rgba(205, 61, 0, 0.8)',
          width: 8,
        }),
      }),
    };

    var selectedPaths = await this.mapSettings.getPaths();
    var layers: VectorLayer[] = [];
    for (var path of selectedPaths) {
      var layer = new VectorLayer({
        source: new VectorSource({
          url: path.sourceUrl,
          format: new GPX(),
        }),
        style: function (feature) {
          return style[feature.getGeometry().getType()];
        },
      });
      layers.push(layer);
    }
    this.layergroup.setLayers(new Collection(layers));
  }

  async ngAfterViewInit() {
    await this.loadSettings();

    this.view = new View({
      constrainResolution: true,
      constrainRotation: false,
      zoom: 12,
      minZoom: 4,
      maxZoom: 18,
      rotation: 0
    });

    this.view.setCenter(fromLonLat(this.initialPosition, this.view.getProjection()));

    this.positionMarker = new Overlay({
      position: fromLonLat(this.initialPosition, this.view.getProjection()),
      positioning: OverlayPositioning.CENTER_CENTER,
      element: this.positionMarkerElement.nativeElement,
      stopEvent: false,
    });

    var control = new ScaleLine();
    var rotateControl = new Rotate({ autoHide: false });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      controls: [control, rotateControl],
      layers: [
        new TileLayer({
          //source: new OSM({ url: 'https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png' }),
          source: this.source
        }),
        this.layergroup
      ],
      view: this.view,
      overlays: [this.positionMarker]
    });

    this.map.on("pointerdrag", () => this.zone.run(() => this.onMapDrag()));

    setTimeout(() => {
      this.map.updateSize();
    }, 500);
  }

  public async navigateClick() {
    if (this.trackingMode === 'Free') {
      this.navService.startTracking(this.view.getProjection());
      var lastPosition = this.positionMarker.getPosition();
      this.view.setCenter(lastPosition);
      this.trackingMode = 'Centered';
      return;
    }
    if (this.trackingMode === 'Centered') {
      await this.navService.startRotationTracking();
      this.view.setZoom(17);
      this.trackingMode = 'Navigation';
      return;
    }
    if (this.trackingMode === 'Navigation') {
      this.navService.stoptRotationTracking();
      this.view.setZoom(15);
      this.view.setRotation(0);
      this.trackingMode = 'Centered';
      return;
    }

    /*  if (this.geolocation.getTracking()) {
        clearTimeout(this.trackingTimeout);
        this.geolocation.setTracking(false);
      }
      else {
        this.centerClick();
        this.geolocation.setTracking(true);
        this.trackingTimeout = setTimeout(() => {
          this.geolocation.setTracking(false);
        }, this.trackingDuration * 60 * 1000);
      }*/

  }

  private onPositionChange(position: Coordinate) {
    this.positionMarker.setPosition(position);
    this.view.setCenter(position);
  }

  private onRotationChange(rotation: number) {
    this.view.setRotation(rotation);
  }

  private onError(err: any) {
    console.error(err);
    alert(err.message);
  }

  private onMapDrag() {
    this.navService.stopTracking();
    this.trackingMode = 'Free';
  }

  async mapSettingsClick() {
    const modal = await this.modalController.create({
      component: MapSettingsComponent,
    });
    await modal.present();
    await modal.onDidDismiss();
    await this.loadSettings();
  }
}
