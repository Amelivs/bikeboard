import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';


@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet id="root-content" [animated]="false"></ion-router-outlet></ion-app>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent { }
