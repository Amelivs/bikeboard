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
import { Activity } from 'src/app/core/data/entities/activity';

import { NavigationService } from '../../core/services/navigation.service';
import { LastPositionService } from '../../core/services/last-position.service';
import { ApplicationService } from '../../core/services/application.service';
import { MapViewerComponent } from './map-viewer/map-viewer.component';
import { ActivitiesComponent } from '../activities/activities.component';

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
  public rotation = 0;
  public attributions: string;

  public origin: number[];
  public waypoints: number[][] = [];
  public destination: number[];

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
    return null;
  }

  public get isTracking() {
    return !this.navService.getTracking();
  }

  constructor(
    private menu: MenuController,
    private navService: NavigationService,
    private zone: NgZone,
    private app: ApplicationService,
    private actionSheetController: ActionSheetController,
    private dataCache: DataCacheService,
    private loadingController: LoadingController,
    private modalController: ModalController,
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
    if (map != null) {
      this.attributions = map.attributions;
      this.map.setXyzSources(map);
    }
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

  public compassClick() {
    this.map.setRotation(0, true);
  }

  public async mileagePress() {

    const actionSheet = await this.actionSheetController.create({
      header: 'Activity',
      buttons: [
        {
          text: 'New activity',
          icon: 'refresh',
          handler: async () => {
            await actionSheet.dismiss();
            await this.trackingService.startNewActivity();
          }
        },
        {
          text: 'Activities',
          icon: 'analytics',
          handler: async () => {
            actionSheet.dismiss();
            this.modalController
              .create({ component: ActivitiesComponent })
              .then(modal => modal.present());
          }
        }
      ]
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

  public onMapDrag() {
    this.navService.stopTracking();
    this.trackingMode = 'Free';
  }

  public onViewRotate(rotation: number) {
    this.rotation = rotation;
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
    if (role === 'defineOriginPoint') {
      this.origin = coords;
      if (this.origin && this.origin.length > 0 && this.destination && this.destination.length > 0) {
        this.calculateDirection();
      }
    }
    if (role === 'defineDestinationPoint') {
      this.destination = coords;
      if (this.origin == null) {
        this.origin = this.map.getGeographicPosition();
      }
      if (this.origin && this.origin.length > 0 && this.destination && this.destination.length > 0) {
        this.calculateDirection();
      }
    }
    if (role === 'addWaypoint') {
      this.waypoints.push(coords);
      if (this.origin && this.origin.length > 0 && this.destination && this.destination.length > 0) {
        this.calculateDirection();
      }
    }
    if (role === 'removeWaypoint') {
      this.waypoints.pop();
      if (this.origin && this.origin.length > 0 && this.destination && this.destination.length > 0) {
        this.calculateDirection();
      }
    }
    let points = [...this.waypoints];
    if (this.origin != null) {
      points.push(this.origin);

    }
    if (this.destination != null) {
      points.push(this.destination);
    }
    this.map.setPoints(points);
    if (role === 'clear') {
      this.map.setDirection(null);
      this.origin = null;
      this.destination = null;
      this.waypoints.length = 0;
      this.map.setPoints(null);
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
        { role: 'defineOriginPoint', text: 'Define origin point', icon: 'location-outline' },
        { role: 'defineDestinationPoint', text: 'Define destination point', icon: 'location-outline' },
        { role: 'addWaypoint', text: 'Add waypoint', icon: 'location-outline' },
        { role: 'removeWaypoint', text: 'Remove waypoint', icon: 'location-outline' },
        { role: 'clear', text: 'Clear itinerary', icon: 'trash-outline' },
        { role: 'cancel', text: 'Cancel', icon: 'close', }
      ]
    });
    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    return role;
  }

  async calculateDirection() {
    let loading = await this.loadingController.create({ message: 'Calculating directions...' });
    loading.present();

    try {
      let direction = await this.directionService.getDirection(this.origin, this.waypoints, this.destination, 'geoapify');
      this.map.setDirection(direction);

    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : err);
    }
    finally {
      loading.dismiss();
    }
  }
}
