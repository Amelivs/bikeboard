import { AfterViewInit, Component, NgZone, ViewChild } from '@angular/core';
import { ActionSheetController, MenuController, ModalController } from '@ionic/angular';
import { toRadians } from 'ol/math';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { TrackingService } from 'src/app/core/services/tracking.service';
import { DownloadUtils } from 'src/app/core/utils/download';
import { LoadingController } from '@ionic/angular';
import { DirectionService } from 'src/app/core/services/direction.service';

import { SettingsComponent } from '../settings/settings.component';
import { NavigationService } from '../../core/services/navigation.service';
import { LastPositionService } from '../../core/services/last-position.service';
import { BellService } from '../../core/services/bell.service';
import { ApplicationService } from '../../core/services/application.service';
import { MapViewerComponent } from './map-viewer/map-viewer.component';

type TrackingMode = 'Free' | 'Centered' | 'Navigation';

@Component({
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements AfterViewInit {

  @ViewChild('map') map: MapViewerComponent;

  public currentSpeed = '-';
  public currentAltitude = '-';
  public currentDistance = 0;

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
    private menu: MenuController,
    private navService: NavigationService,
    private bellService: BellService,
    private zone: NgZone,
    private app: ApplicationService,
    private actionSheetController: ActionSheetController,
    private dataCache: DataCacheService,
    private loadingController: LoadingController,
    private directionService: DirectionService,
    private trackingService: TrackingService,
    private lastPositionSrv: LastPositionService) {
    this.navService.position.subscribe(position => this.onPositionChange(position), err => { this.onError(err); });
    this.navService.heading.subscribe(rotation => this.onHeadingChange(rotation), err => { this.onError(err); });
    this.navService.speed.subscribe(speed => { this.currentSpeed = speed?.toFixed(1) || '-'; }, err => { this.onError(err); });
    this.navService.altitude.subscribe(alt => { this.currentAltitude = alt?.toFixed(0) || '-'; }, err => { this.onError(err); });
    this.trackingService.distance$.subscribe(distance => {
      this.zone.run(() => {
        this.currentDistance = distance;
      });
    });
  }

  private onMapChange(map: MapEntity) {
    this.map.setXyzSources(map);
  }

  private onPathsChange(paths: PathEntity[]) {
    this.map.setGpxSources(paths);
  }

  async ngAfterViewInit() {
    this.dataCache.activeMap.subscribe(map => this.onMapChange(map));
    this.dataCache.activePaths.subscribe(paths => this.onPathsChange(paths));

    let lastPosition = await this.lastPositionSrv.getLastPosition();
    this.map.setPosition(lastPosition);
  }

  public menuClick() {
    this.menu.open();
  }

  public async mileagePress() {

    const actionSheet = await this.actionSheetController.create({
      header: 'Mileage',
      buttons: [
        {
          text: 'Clear mileage',
          icon: 'trash-outline',
          handler: async () => {
            await actionSheet.dismiss();
            await this.trackingService.clearMileage();
          }
        },
        {
          text: 'Export',
          icon: 'share-outline',
          handler: async () => {
            actionSheet.dismiss();
            let data = await this.trackingService.export();
            let now = new Date();
            await DownloadUtils.download(data, `trace-${now.toISOString()}.gpx`);
          }
        }]
    });
    await actionSheet.present();
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
      let ok = await this.navService.startHeadingTracking();
      if (!ok) {
        return;
      }
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
  }

  public async onContext(coords: number[]) {
    let role = await this.presentActionSheet();
    if (role === 'save') {
      await this.storeClick();
    }
    if (role === 'itineraryTo') {
      this.calculateDirection(coords);
    }
    if (role === 'clear') {
      this.map.setWkt(null);
    }
  }

  async storeClick() {
    let urls = this.map.getBoundingBoxTileUrls();
    console.dir(urls);
    if (urls.length > 250) {
      alert('Zone is too large');
      return;
    }
    let fetchTasks = urls.map(url => fetch(url, { mode: 'cors' }));
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

  async calculateDirection(toCoords: number[]) {
    let loading = await this.loadingController.create({ message: 'Calculating directions...' });
    loading.present();

    try {
      let fromCoords = this.map.getGeographicPosition();
      let data = await this.directionService.getDirection(fromCoords, toCoords);
      this.map.setWkt(data.geometryWkt);

    } catch (err) {
      alert(err.message);
      console.error(err.message);
    }
    finally {
      loading.dismiss();
    }
  }
}
