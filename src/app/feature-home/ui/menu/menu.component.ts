import { Component, OnInit } from '@angular/core';
import { IonItemSliding, MenuController, IonicModule } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import { MapEntity } from 'src/app/core/data/entities/map';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { NgFor, AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    AsyncPipe,
  ],
})
export class MenuComponent implements OnInit {

  readonly maps$: Observable<MapEntity[]>;
  readonly paths$: Observable<PathEntity[]>;

  selectedMap: MapEntity | nil;
  selectedPaths: PathEntity[] = [];

  constructor(private service: DataCacheService, private menu: MenuController, private dialogSrv: DialogService) {
    this.maps$ = service.maps;
    this.paths$ = service.paths;
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
