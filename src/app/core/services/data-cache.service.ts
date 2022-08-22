import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { DataContext } from '../data/data-context';
import { MapEntity } from '../data/entities/map';
import { PathEntity } from '../data/entities/path';

@Injectable({
  providedIn: 'root'
})
export class DataCacheService {

  private readonly maps$ = new ReplaySubject<MapEntity[]>(1);
  private readonly activeMap$ = new ReplaySubject<MapEntity>(1);
  private readonly paths$ = new ReplaySubject<PathEntity[]>(1);
  private readonly activePaths$ = new ReplaySubject<PathEntity[]>(1);

  private async loadMaps() {
    let maps = await this.context.maps.getAll();
    maps = maps.sort((left, right) => left.name > right.name ? 1 : right.name > left.name ? -1 : 0);
    let activeMapId = await this.context.preferences.get('activeMapId');
    let activeMap = maps.find(map => map.id === activeMapId);
    this.activeMap$.next(activeMap);
    this.maps$.next(maps);
  }

  private async loadPaths() {
    let paths = await this.context.paths.getAll();
    paths = paths.sort((left, right) => left.name > right.name ? 1 : right.name > left.name ? -1 : 0);
    let activePathIds = await this.context.preferences.get<string[]>('activePathIds');
    let activePaths = paths.filter(path => activePathIds?.indexOf(path.id) >= 0);
    this.activePaths$.next(activePaths);
    this.paths$.next(paths);
  }

  constructor(private context: DataContext) {
    try {
      this.loadMaps();
      this.loadPaths();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : err);
    }
  }

  public readonly maps = this.maps$.asObservable();
  public readonly activeMap = this.activeMap$.asObservable();
  public readonly paths = this.paths$.asObservable();
  public readonly activePaths = this.activePaths$.asObservable();

  public async saveMap(map: MapEntity) {
    await this.context.maps.save(map);
    await this.loadMaps();
  }

  public async setActiveMap(map: MapEntity) {
    await this.context.preferences.save('activeMapId', map.id);
    this.activeMap$.next(map);
  }

  public async savePath(path: PathEntity) {
    await this.context.paths.save(path);
    await this.loadPaths();
  }

  public async setActivePaths(paths: PathEntity[]) {
    await this.context.preferences.save('activePathIds', paths.map(p => p.id));
    this.activePaths$.next(paths);
  }

  public async deleteMap(id: string) {
    await this.context.maps.delete(id);
    await this.loadMaps();
  }

  public async deletePath(id: string) {
    await this.context.paths.delete(id);
    await this.loadPaths();
  }
}
