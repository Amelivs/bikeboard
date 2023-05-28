import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-root',
  template: '<ion-app><router-outlet></router-outlet></ion-app>',
  standalone: true,
  imports: [IonicModule, RouterOutlet]
})
export class AppComponent { }
