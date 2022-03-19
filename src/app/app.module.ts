import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { MapSettingsComponent } from './core/components/map-settings/map-settings.component';
import { FormsModule } from '@angular/forms';
import { MapSelectorComponent } from './core/components/map-selector/map-selector.component';
import { LongPressDirective } from './core/directives/longPress';
import { MapComponent } from './core/components/map/map.component';
import { MapPage } from './features/map/map.page';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    MapPage,
    LongPressDirective,
    MapSelectorComponent,
    MapSettingsComponent
  ],
  entryComponents: [
    MapSettingsComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerImmediately'
    })],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule { }
