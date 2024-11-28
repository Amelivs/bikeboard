import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';

import { SettingsComponent } from './feature/settings/settings.component';


@Component({
  selector: 'app-settings-nav',
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonNav]
})
export class SettingsNavComponent {

  readonly rootPage = SettingsComponent;
}
