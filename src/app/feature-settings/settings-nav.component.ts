import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { SettingsComponent } from './feature/settings/settings.component';


@Component({
  selector: 'app-settings-nav',
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  standalone: true,
  imports: [IonicModule]
})
export class SettingsNavComponent {

  rootPage = SettingsComponent;
}
