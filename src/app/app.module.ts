import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { SettingsComponent } from './features/settings/settings.component';
import { MenuComponent } from './features/menu/menu.component';
import { LongPressDirective } from './core/directives/longPress';
import { MapViewerComponent } from './features/map/map-viewer/map-viewer.component';
import { MapPage } from './features/map/map.page';
import { ImportPathComponent } from './features/import-path/import-path.component';
import { DataContext } from './core/data/data-context';
import { HomeComponent } from './features/home/home.component';
import { ImportMapComponent } from './features/import-map/import-map.component';


@NgModule({
  declarations: [
    AppComponent,
    MapViewerComponent,
    MapPage,
    LongPressDirective,
    MenuComponent,
    SettingsComponent,
    ImportPathComponent,
    ImportMapComponent,
    HomeComponent
  ],
  entryComponents: [
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.useServiceWorker,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerImmediately'
    })],
  providers: [DataContext, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule { }
