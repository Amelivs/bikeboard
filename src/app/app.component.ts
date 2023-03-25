import { Component, OnInit } from '@angular/core';

import { ApplicationService } from './core/services/application.service';


@Component({
  selector: 'app-root',
  template: '<ion-app><router-outlet></router-outlet></ion-app>'
})
export class AppComponent implements OnInit {

  constructor(private app: ApplicationService) { }

  ngOnInit() {
    this.app.lockScreen();
  }
}
