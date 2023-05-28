/* eslint-disable no-restricted-globals */
import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IonicStorageModule } from '@ionic/storage-angular';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { IonicRouteStrategy, IonicModule } from '@ionic/angular';
import { provideRouter, RouteReuseStrategy } from '@angular/router';

import { appRoutes } from './app/app.routes';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { GlobalErrorHandler } from './app/core/handlers/global-error-handler';
import { DataContext } from './app/core/data/data-context';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    importProvidersFrom(BrowserModule, IonicModule.forRoot(), IonicStorageModule.forRoot(), ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.useServiceWorker,
      // Register the ServiceWorker as soon as the app is stable
      // or after 10 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:10000'
    })),
    DataContext,
    { provide: Window, useValue: window },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ]
})
  .catch(err => console.error(err));
