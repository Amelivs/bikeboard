import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Map, Overlay, View, Collection } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke } from 'ol/style';
import { ScaleLine, Rotate, } from 'ol/control';
import OverlayPositioning from 'ol/OverlayPositioning';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GPX from 'ol/format/GPX';
import { MapSettingsComponent } from '../map-settings/map-settings.component';
import { MapSettingsService, NavigationMode } from '../services/map-settings.service';
import { NavigationService } from '../services/navigation.service';
import { LastPositionService } from '../services/last-position.service';
import { toRadians } from 'ol/math';
import { BellService } from '../services/bell.service';
import { ScreenService } from '../services/pause.service';
import Layer from 'ol/layer/Layer';

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
  private trackingDuration: number;
  private navigationMode: NavigationMode;
  private tileLayerGroup = new LayerGroup();
  private layergroup = new LayerGroup();
  private positionMarker: Overlay;

  public currentSpeed = '0.0';
  public currentAltitude = '0';

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

  constructor(
    private zone: NgZone,
    private modalController: ModalController,
    private mapSettings: MapSettingsService,
    private navService: NavigationService,
    private bellService: BellService,
    private screenService: ScreenService,
    private lastPositionSrv: LastPositionService) {
    this.navService.position.subscribe(position => this.onPositionChange(position), err => { this.onError(err); });
    this.navService.heading.subscribe(rotation => this.onHeadingChange(rotation), err => { this.onError(err); });
    this.navService.speed.subscribe(speed => { this.currentSpeed = speed?.toFixed(1) || '0.0' }, err => { this.onError(err); });
    this.navService.altitude.subscribe(alt => { this.currentAltitude = alt?.toFixed(0) || '0' }, err => { this.onError(err); });
    this.screenService.off.subscribe(() => { this.onScreenOff(); });
  }

  private onScreenOff() {
    this.zone.run(() => {
      console.debug('Handling screen off event');
      if (this.trackingMode !== 'Free') {
        this.navService.stopTracking();
        this.trackingMode = 'Free';
      }
    });
  }

  private async loadSettings() {
    let selectedMap = await this.mapSettings.getMap();

    var osmLayers = selectedMap.sourceUrls.map(url => new TileLayer({ source: new OSM({ url, opaque:false }) }));
    this.tileLayerGroup.setLayers(new Collection(osmLayers));

    this.trackingDuration = await this.mapSettings.getTrackingDuration();
    this.navigationMode = await this.mapSettings.getMode();

    let style = {
      MultiLineString: new Style({
        stroke: new Stroke({
          color: 'rgba(205, 61, 0, 0.8)',
          width: 8,
        }),
      }),
    };

    let selectedPaths = await this.mapSettings.getPaths();
    let layers: VectorLayer[] = [];
    for (let path of selectedPaths) {
      let layer = new VectorLayer({
        source: new VectorSource({
          url: path.sourceUrls[0],
          format: new GPX(),
        }),
        style(feature) {
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
      zoom: 14,
      minZoom: 4,
      maxZoom: 18,
      rotation: 0
    });

    let lastPosition = await this.lastPositionSrv.getLastPosition();

    this.view.setCenter(fromLonLat(lastPosition, this.view.getProjection()));

    this.positionMarker = new Overlay({
      position: fromLonLat(lastPosition, this.view.getProjection()),
      positioning: OverlayPositioning.CENTER_CENTER,
      element: this.positionMarkerElement.nativeElement,
      stopEvent: false,
    });

    let control = new ScaleLine();
    let rotateControl = new Rotate({ autoHide: false });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      controls: [control, rotateControl],
      layers: [
        this.tileLayerGroup,
        this.layergroup
      ],
      view: this.view,
      overlays: [this.positionMarker]
    });

    this.map.on('pointerdrag', () => this.zone.run(() => this.onMapDrag()));

    setTimeout(() => {
      this.map.updateSize();
    }, 500);
  }

  public async navigateClick() {
    if (this.trackingMode === 'Free') {
      this.navService.startTracking();
      let lastPosition = this.positionMarker.getPosition();
      this.view.setCenter(lastPosition);
      this.trackingMode = 'Centered';
      return;
    }
    if (this.trackingMode === 'Centered') {
      await this.navService.startHeadingTracking();
      this.view.setZoom(17);
      this.trackingMode = 'Navigation';
      return;
    }
    if (this.trackingMode === 'Navigation') {
      this.navService.stoptHeadingTracking();
      this.view.setZoom(15);
      this.view.setRotation(0);
      this.trackingMode = 'Centered';
      return;
    }
  }

  public bellClick(event?: Event) {
    this.bellService.honk();
    event?.preventDefault();
  }

  private onPositionChange(position: number[]) {
    var coords = fromLonLat(position, this.view.getProjection());
    this.positionMarker.setPosition(coords);
    this.view.setCenter(coords);
  }

  private onHeadingChange(heading: number) {
    let rotation = toRadians((360 - heading) % 360)
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
