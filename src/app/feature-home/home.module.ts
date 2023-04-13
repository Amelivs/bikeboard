import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { HomeComponent } from './feature/home.component';
import { MenuComponent } from './ui/menu/menu.component';
import { SettingsModule } from '../feature-settings/settings.module';
import { ImportModule } from '../feature-import/import.module';
import { DebuggingModule } from '../feature-debugging/debugging.module';


@NgModule({
  declarations: [
    MenuComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SettingsModule,
    ImportModule,
    DebuggingModule
  ]
})
export class HomeModule { }
