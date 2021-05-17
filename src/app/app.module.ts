import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { MapSettingsComponent } from './map-settings/map-settings.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AppComponent,
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
      enabled: environment.production || true,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule { }
