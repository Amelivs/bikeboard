import { Component, OnInit, inject } from '@angular/core';
import { IonItemSliding, MenuController, IonList, IonItemDivider, IonLabel, IonItem, IonCheckbox, IonRadio, IonItemOptions, IonItemOption, IonIcon, IonRadioGroup } from '@ionic/angular/standalone';
import { firstValueFrom, Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MapEntity } from '../../../core/data/entities/map';
import { PathEntity } from '../../../core/data/entities/path';
import { DataCacheService } from '../../../core/services/data-cache.service';
import { DialogService } from '../../../core/services/dialog.service';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  standalone: true,
  imports: [FormsModule, NgFor, AsyncPipe, IonList, IonItemDivider, IonLabel, IonItemSliding, IonItem, IonCheckbox, IonRadio, IonRadioGroup, IonItemOptions, IonItemOption, IonIcon],
})
export class MenuComponent implements OnInit {
  private readonly service = inject(DataCacheService);
  private readonly menu = inject(MenuController);
  private readonly dialogSrv = inject(DialogService);

  readonly maps$: Observable<MapEntity[]>;
  readonly paths$: Observable<PathEntity[]>;

  selectedMap: MapEntity | nil;
  selectedPaths: PathEntity[] = [];

  constructor() {
    this.maps$ = this.service.maps;
    this.paths$ = this.service.paths;
  }

  async ngOnInit() {
    this.selectedMap = await firstValueFrom(this.service.activeMap);
    this.selectedPaths = await firstValueFrom(this.service.activePaths);
  }

  selectionChange() {
    this.menu.close();
    if (this.selectedMap != null) {
      this.service.setActiveMap(this.selectedMap);
    }
  }

  isChecked(path: PathEntity) {
    return this.selectedPaths.includes(path);
  }

  isActiveMap(map: MapEntity) {
    return map === this.selectedMap;
  }

  checkedChange(event: any, path: PathEntity) {
    let checked = event.detail.checked;
    if (checked === true) {
      if (!this.selectedPaths.includes(path)) {
        this.selectedPaths.push(path);
      }
    }
    else {
      let index = this.selectedPaths.indexOf(path);
      if (index >= 0) {
        this.selectedPaths.splice(index, 1);
      }
    }
    this.service.setActivePaths(this.selectedPaths);
  }

  async deleteMap(slidingItem: IonItemSliding, map: MapEntity) {
    slidingItem.close();
    if (this.dialogSrv.confirm(`Map '${map.name}' will be permanently deleted.`)) {
      await this.service.deleteMap(map.id);
    }
  }

  async deletePath(slidingItem: IonItemSliding, path: PathEntity) {
    slidingItem.close();
    if (this.dialogSrv.confirm(`Path '${path.name}' will be permanently deleted.`)) {
      await this.service.deletePath(path.id);
    }
  }
}
