import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet id="root-content" [animated]="false"></ion-router-outlet></ion-app>',
  standalone: true,
  imports: [IonicModule]
})
export class AppComponent { }
