import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActionSheetController, MenuController, ModalController } from '@ionic/angular';
import { toRadians } from 'ol/math';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { TrackingService } from 'src/app/core/services/tracking.service';
import { LoadingController } from '@ionic/angular';
import { DirectionService } from 'src/app/core/services/direction.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { ActivitiesComponent } from 'src/app/feature-activities/feature/activities.component';

import { NavigationService } from '../../core/services/navigation.service';
import { LastPositionService } from '../../core/services/last-position.service';
import { MapViewer } from '../model/map-viewer';


type TrackingMode = 'Free' | 'Centered' | 'Navigation';

@Component({
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {

  @ViewChild('map') map!: MapViewer;

  public rotation = 0;
  public attributions: string | nil;

  public origin: number[] | nil;
  public waypoints: number[][] = [];
  public destination: number[] | nil;

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

  public get currentSpeed() {
    return this.navService.speed;
  }

  public get currentAltitude() {
    return this.navService.altitude;
  }

  public get currentDistance() {
    return this.trackingService.distance$;
  }

  constructor(
    private menu: MenuController,
    private navService: NavigationService,
    private actionSheetController: ActionSheetController,
    private dataCache: DataCacheService,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private directionService: DirectionService,
    private trackingService: TrackingService,
    private dialogSrv: DialogService,
    private lastPositionSrv: LastPositionService) {
    this.navService.position.subscribe(position => this.onPositionChange(position));
    this.navService.heading.subscribe(rotation => this.onHeadingChange(rotation));
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

  private onPositionChange(coords: GeolocationCoordinates) {
    let position = [coords.longitude, coords.latitude];
    this.map.setPosition(position);
    this.map.setCenter(position);
    this.map.setAccuracy(position, coords.accuracy);
  }

  private onHeadingChange(heading: number) {
    let rotation = -1 * toRadians(heading);
    this.map.setRotation(rotation);
  }

  public async onContext(coords: number[]) {
    let role = await this.presentActionSheet();
    if (role === 'save') {
      await this.storeClick();
    }
    if (role === 'defineOriginPoint') {
      this.origin = coords;
      this.calculateDirection();
    }
    if (role === 'defineDestinationPoint') {
      this.destination = coords;
      if (this.origin == null) {
        this.origin = this.map.getGeographicPosition();
      }
      this.calculateDirection();
    }
    if (role === 'addWaypoint') {
      this.waypoints.push(coords);
      this.calculateDirection();
    }
    if (role === 'removeWaypoint') {
      this.waypoints.pop();
      this.calculateDirection();
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
    if (urls.length > 250) {
      this.dialogSrv.alert('Zone is too large');
      return;
    }
    let fetchTasks = urls.map(url => fetch(url, { mode: 'cors' }));
    try {
      await Promise.all(fetchTasks);
    }
    catch (err) {
      console.error(err);
      this.dialogSrv.alert(err);
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
    if (this.origin == null || this.destination == null || this.origin.length <= 0 || this.destination.length <= 0) {
      return;
    }
    let loading = await this.loadingController.create({ message: 'Calculating directions...' });
    loading.present();

    try {
      let direction = await this.directionService.getDirection(this.origin, this.waypoints, this.destination, 'geoapify');
      this.map.setDirection(direction);

    } catch (err) {
      console.error(err);
      this.dialogSrv.alert(err);
    }
    finally {
      loading.dismiss();
    }
  }
}
