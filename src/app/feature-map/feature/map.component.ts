import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, MenuController, ModalController } from '@ionic/angular';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { TrackingService } from 'src/app/core/services/tracking.service';
import { LoadingController } from '@ionic/angular';
import { DirectionService } from 'src/app/core/services/direction.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { ActivitiesComponent } from 'src/app/feature-activities/feature/activities.component';

import { NavigationService } from '../../core/services/navigation.service';
import { MapViewerComponent } from '../ui/map-viewer/map-viewer.component';


type TrackingMode = 'None' | 'Follow' | 'FollowWithHeading';

@Component({
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {

  @ViewChild(MapViewerComponent, { static: true }) mapViewer!: MapViewerComponent;

  public rotation = 0;
  public attributions: string | nil;
  public elevationAvailable = false;

  public origin: number[] | nil;
  public waypoints: number[][] = [];
  public destination: number[] | nil;

  public trackingMode: TrackingMode = 'None';

  public get navIcon() {
    if (this.trackingMode === 'None') {
      return 'navigate-outline';
    }
    if (this.trackingMode === 'Follow') {
      return 'navigate';
    }
    if (this.trackingMode === 'FollowWithHeading') {
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
    private dialogSrv: DialogService) { }

  private onMapChange(map: MapEntity) {
    if (map != null) {
      this.mapViewer.setXyzSources(map);
    }
  }

  private onPathsChange(paths: PathEntity[]) {
    this.mapViewer.setGpxSources(paths);
  }

  private onPositionChange(coords: number[]) {
    let position = [coords[0], coords[1]];
    this.mapViewer.setPosition(position);
  }

  private onHeadingChange(heading: number) {
    this.mapViewer.setRotation(heading);
  }

  ngOnInit() {
    this.dataCache.activeMap.subscribe(map => this.onMapChange(map));
    this.dataCache.activePaths.subscribe(paths => this.onPathsChange(paths));
    this.navService.position.subscribe(position => this.onPositionChange(position));
    this.navService.heading.subscribe(rotation => this.onHeadingChange(rotation));
  }

  public menuClick() {
    this.menu.open();
  }

  public compassClick() {
    this.mapViewer.setRotation(0, true);
  }

  public elevationClick() {
    this.mapViewer.toggleElevation();
  }

  public onElevationAvailable(enabled: boolean) {
    this.elevationAvailable = enabled;
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
    if (this.trackingMode === 'None') {
      this.navService.startTracking();
      this.trackingMode = 'Follow';
      return;
    }
    if (this.trackingMode === 'Follow') {
      let ok = await this.navService.startHeadingTracking();
      if (!ok) {
        return;
      }
      this.trackingMode = 'FollowWithHeading';
      return;
    }
    if (this.trackingMode === 'FollowWithHeading') {
      this.navService.stoptHeadingTracking();
      this.mapViewer.setRotation(0);
      this.trackingMode = 'Follow';
      return;
    }
  }

  public onMapDrag() {
    this.navService.stopTracking();
    this.trackingMode = 'None';
  }

  public onViewRotate(rotation: number) {
    this.rotation = rotation;
  }

  public async onMapDblClick() {
    this.navService.startTracking();
    await this.navService.startHeadingTracking();
    this.trackingMode = 'FollowWithHeading';
  }

  public async onContext(coords: number[]) {
    let role = await this.presentActionSheet();
    if (role === 'defineOriginPoint') {
      this.origin = coords;
      this.calculateDirection();
    }
    if (role === 'defineDestinationPoint') {
      this.destination = coords;
      if (this.origin == null) {
        this.origin = this.mapViewer.getPosition();
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
    this.mapViewer.setPoints(points);
    if (role === 'clear') {
      this.mapViewer.setDirection(null);
      this.origin = null;
      this.destination = null;
      this.waypoints.length = 0;
      this.mapViewer.setPoints(null);
    }
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Map',
      buttons: [
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
      this.mapViewer.setDirection(direction);

    } catch (err) {
      console.error(err);
      this.dialogSrv.alert(err);
    }
    finally {
      loading.dismiss();
    }
  }
}
