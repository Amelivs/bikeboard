/* eslint-disable no-restricted-globals */
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { AttributionsComponent } from './feature/attributions/attributions.component';
import { SettingsComponent } from './feature/settings/settings.component';
import { SettingsNavComponent } from './settings-nav.component';


@NgModule({
  declarations: [
    SettingsNavComponent,
    SettingsComponent,
    AttributionsComponent
  ],
  imports: [
    IonicModule
  ]
})
export class SettingsModule { }
