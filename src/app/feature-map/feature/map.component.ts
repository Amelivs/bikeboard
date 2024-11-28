import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActionSheetController, MenuController, LoadingController, IonContent, IonFooter, IonButton, IonButtons, IonToolbar, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { NgIf, AsyncPipe } from '@angular/common';

import { MapEntity } from '../../core/data/entities/map';
import { PathEntity } from '../../core/data/entities/path';
import { DataCacheService } from '../../core/services/data-cache.service';
import { TrackingService } from '../../core/services/tracking.service';
import { DirectionService } from '../../core/services/direction.service';
import { DialogService } from '../../core/services/dialog.service';
import { ActivitiesComponent } from '../../feature-activities/feature/activities.component';
import { OverlayService } from '../../core/services/overlay.service';
import { NavigationService } from '../../core/services/navigation.service';
import { MapViewerComponent } from '../ui/map-viewer/map-viewer.component';
import { KilometerPipe } from '../../shared/ui/pipes/kilometer.pipe';
import { FixedPipe } from '../../shared/ui/pipes/fixed.pipe';


type TrackingMode = 'None' | 'Follow' | 'FollowWithHeading';

@Component({
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MapViewerComponent, NgIf, AsyncPipe, FixedPipe, KilometerPipe, IonContent, IonFooter, IonButton, IonButtons, IonToolbar, IonFab, IonFabButton, IonIcon]
})
export class MapComponent implements OnInit {
  private readonly menu = inject(MenuController);
  private readonly navService = inject(NavigationService);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly dataCache = inject(DataCacheService);
  private readonly loadingController = inject(LoadingController);
  private readonly overlaySrv = inject(OverlayService);
  private readonly directionService = inject(DirectionService);
  private readonly trackingService = inject(TrackingService);
  private readonly dialogSrv = inject(DialogService);

  @ViewChild(MapViewerComponent, { static: true }) mapViewer!: MapViewerComponent;

  readonly rotation = signal(0);
  readonly terrainAvailable = signal(false);
  readonly trackingMode = signal<TrackingMode>('None');
  readonly currentSpeed = this.navService.speed;
  readonly currentAltitude = this.navService.altitude;
  readonly currentDistance = this.trackingService.distance$;

  readonly navIcon = computed(() => {
    if (this.trackingMode() === 'None') {
      return 'navigate-outline';
    }
    if (this.trackingMode() === 'Follow') {
      return 'navigate';
    }
    if (this.trackingMode() === 'FollowWithHeading') {
      return 'compass';
    }
    return null;
  })

  private origin: number[] | nil;
  private waypoints: number[][] = [];
  private destination: number[] | nil;

  public get isTracking() {
    return !this.navService.getTracking();
  }

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

  public terrainClick() {
    this.mapViewer.toggleTerrain();
  }

  public onTerrainAvailable(enabled: boolean) {
    this.terrainAvailable.set(enabled);
  }

  public async mileagePress() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Activity',
      buttons: [
        {
          text: 'New activity',
          icon: 'refresh-outline',
          handler: async () => {
            await actionSheet.dismiss();
            await this.trackingService.startNewActivity();
          }
        },
        {
          text: 'Activities',
          icon: 'analytics-outline',
          handler: async () => {
            actionSheet.dismiss();
            this.overlaySrv.showModal(ActivitiesComponent);
          }
        }
      ]
    });
    await actionSheet.present();
  }

  public async navigateClick() {
    if (this.trackingMode() === 'None') {
      this.navService.startTracking();
      this.trackingMode.set('Follow');
      return;
    }
    if (this.trackingMode() === 'Follow') {
      let ok = await this.navService.startHeadingTracking();
      if (!ok) {
        return;
      }
      this.trackingMode.set('FollowWithHeading');
      return;
    }
    if (this.trackingMode() === 'FollowWithHeading') {
      this.navService.stoptHeadingTracking();
      this.mapViewer.setRotation(0);
      this.trackingMode.set('Follow');
      return;
    }
  }

  public onMapDrag() {
    this.navService.stopTracking();
    this.trackingMode.set('None');
  }

  public onViewRotate(rotation: number) {
    this.rotation.set(rotation);
  }

  public async onMapDblClick() {
    this.navService.startTracking();
    await this.navService.startHeadingTracking();
    this.trackingMode.set('FollowWithHeading');
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
        { role: 'cancel', text: 'Cancel', icon: 'close-outline', }
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
