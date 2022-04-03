import { Component, OnInit } from '@angular/core';

import { HomeSettingsComponent } from './home-settings/home-settings.component';


@Component({
  selector: 'app-home-settings',
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class SettingsComponent {

  rootPage = HomeSettingsComponent;
}
