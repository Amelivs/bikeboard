import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { MapSettingsComponent } from '../map-settings/map-settings.component';
import { Layer, MapSettingsService } from '../services/map-settings.service';
import { NavigationService } from '../services/navigation.service';
import { LastPositionService } from '../services/last-position.service';
import { toRadians } from 'ol/math';
import { BellService } from '../services/bell.service';
import { ScreenService } from '../services/pause.service';
import { MapComponent } from '../components/map/map.component';
import { MapSelectorService } from '../components/map-selector/map-selector.service';

type TrackingMode = 'Free' | 'Centered' | 'Navigation';

@Component({
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements AfterViewInit {

  @ViewChild('map') map: MapComponent;

  private trackingDuration: number;

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
    return !this.navService.getTracking();
  }

  constructor(
    private modalController: ModalController,
    private mapSettings: MapSettingsService,
    private navService: NavigationService,
    private bellService: BellService,
    private screenService: ScreenService,
    public actionSheetController: ActionSheetController,
    public mapSelectorService: MapSelectorService,
    private lastPositionSrv: LastPositionService) {
    this.navService.position.subscribe(position => this.onPositionChange(position), err => { this.onError(err); });
    this.navService.heading.subscribe(rotation => this.onHeadingChange(rotation), err => { this.onError(err); });
    this.navService.speed.subscribe(speed => { this.currentSpeed = speed?.toFixed(1) || '0.0'; }, err => { this.onError(err); });
    this.navService.altitude.subscribe(alt => { this.currentAltitude = alt?.toFixed(0) || '0'; }, err => { this.onError(err); });
    this.screenService.off.subscribe(() => { this.onScreenOff(); });
  }

  private onScreenOff() {
    console.debug('Handling screen off event');
    if (this.trackingMode !== 'Free') {
      this.navService.stopTracking();
      this.trackingMode = 'Free';
    }
  }

  private onMapChange(map: Layer) {
    this.map.setXyzSources(map.sourceUrls, map.maxZoom);
  }

  private async loadSettings() {
    this.trackingDuration = await this.mapSettings.getTrackingDuration();
    let selectedPaths = await this.mapSettings.getPaths();
    this.map.setGpxSources(selectedPaths);
  }

  async ngAfterViewInit() {
    this.mapSelectorService.activeMap.subscribe(map => this.onMapChange(map));

    await this.loadSettings();

    let lastPosition = await this.lastPositionSrv.getLastPosition();
    this.map.setPosition(lastPosition);
  }

  public async navigateClick() {
    if (this.trackingMode === 'Free') {
      this.navService.startTracking();
      let lastPosition = this.map.getPosition();
      this.map.setCenter(lastPosition);
      this.trackingMode = 'Centered';
      return;
    }
    if (this.trackingMode === 'Centered') {
      await this.navService.startHeadingTracking();
      this.trackingMode = 'Navigation';
      return;
    }
    if (this.trackingMode === 'Navigation') {
      this.navService.stoptHeadingTracking();
      this.map.setRotation(0);
      this.trackingMode = 'Centered';
      return;
    }
  }

  public bellClick(event?: Event) {
    this.bellService.honk();
    event?.preventDefault();
  }

  public onMapDrag() {
    this.navService.stopTracking();
    this.trackingMode = 'Free';
  }

  public async onMapDblClick() {
    this.navService.startTracking();
    await this.navService.startHeadingTracking();
    this.trackingMode = 'Navigation';
  }

  private onPositionChange(position: number[]) {
    this.map.setPosition(position);
    this.map.setCenter(position);
  }

  private onHeadingChange(heading: number) {
    let rotation = toRadians((360 - heading) % 360);
    this.map.setRotation(rotation);
  }

  private onError(err: any) {
    console.error(err);
    alert(err.message);
  }

  public async onContext(coords: number[]) {
    let role = await this.presentActionSheet();
    if (role === 'save') {
      await this.storeClick();
    }
    if (role === 'itineraryTo') {
      this.fetchItinerary(coords);
    }
    if (role === 'clear') {
      this.map.setWkt(null);
    }
  }

  async storeClick() {
    var urls = this.map.getBoundingBoxTileUrls();
    console.dir(urls);
    if (urls.length > 250) {
      alert('Zone is too large')
      return;
    }
    var fetchTasks = urls.map(url => fetch(url, { mode: 'cors' }));
    try {
      await Promise.all(fetchTasks);
    }
    catch (err) {
      console.error(err);
      alert(err);
    }
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Map',
      buttons: [
        { role: 'save', text: 'Save map for offline use', icon: 'cloud-offline-outline' },
        { role: 'itineraryTo', text: 'Itinerary to this point', icon: 'map-outline' },
        { role: 'clear', text: 'Clear itinerary', icon: 'trash-outline' },
        { role: 'cancel', text: 'Cancel', icon: 'close', }
      ]
    });
    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    return role;
  }

  async mapSettingsClick() {
    const modal = await this.modalController.create({
      component: MapSettingsComponent,
    });
    await modal.present();
    await modal.onDidDismiss();
    await this.loadSettings();
  }

  fetchItinerary(toCoords: number[]) {
    var fromCoords = this.map.getGeographicPosition();
    fetch(`https://wxs.ign.fr/essentiels/itineraire/rest/route.json?origin=${fromCoords[0]},${fromCoords[1]}&destination=${toCoords[0]},${toCoords[1]}&&method=DISTANCE&graphName=Pieton`)
      .then(res => res.json())
      .then(r => {
        this.map.setWkt(r['geometryWkt']);
      })
  }
}
