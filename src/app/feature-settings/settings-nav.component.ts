import { Component } from '@angular/core';

import { SettingsComponent } from './feature/settings/settings.component';


@Component({
  selector: 'app-settings-nav',
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class SettingsNavComponent {

  rootPage = SettingsComponent;
}
