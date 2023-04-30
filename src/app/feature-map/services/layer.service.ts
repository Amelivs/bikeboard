import { Injectable } from '@angular/core';
import { LayerSpecification, SourceSpecification, StyleSpecification } from 'maplibre-gl';
import { PathEntity } from 'src/app/core/data/entities/path';
import { DirectionResult } from 'src/app/core/services/direction.service';
import { GeoJsonUtil } from 'src/app/shared/utils/geojson';

@Injectable()
export class LayerService {

  private readonly pathSources = new Map<string, SourceSpecification>();
  private readonly pathLayers: LayerSpecification[] = [];

  private readonly directionSources = new Map<string, SourceSpecification>();
  private readonly directionLayers: LayerSpecification[] = [];

  private isCustom(layer: LayerSpecification) {
    let metadata = layer.metadata as any;
    return metadata?.custom === true ?? false;
  }

  constructor() { }

  async setPathLayers(paths: PathEntity[]) {
    this.pathSources.clear();
    this.pathLayers.length = 0;

    for (let path of paths) {
      const gpx = await fetch(path.url).then(res => res.text());
      const geoJson = GeoJsonUtil.fromGpx(gpx);

      this.pathSources.set(path.id, {
        type: 'geojson',
        data: geoJson
      });

      this.pathLayers.push({
        id: path.id,
        type: 'line',
        source: path.id,
        metadata: {
          custom: true
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff0000',
          'line-opacity': 0.6,
          'line-width': 8
        }
      });
    }
  }

  setDirectionLayer(direction: DirectionResult | nil) {
    this.directionSources.clear();
    this.directionLayers.length = 0;

    if (direction == null) return;

    this.directionSources.set('directions', {
      type: 'geojson',
      data: direction.data
    });

    this.directionLayers.push({
      id: 'directions',
      type: 'line',
      source: 'directions',
      metadata: {
        custom: true
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ff0000',
        'line-opacity': 0.6,
        'line-width': 8
      }
    });
  }

  public appendLayers(style: StyleSpecification) {
    let customLayers = style.layers.filter(l => this.isCustom(l));
    customLayers.forEach((layer) => {
      style.layers.splice(style.layers.indexOf(layer), 1);
      delete style.sources[layer.id];
    });
    this.pathLayers.forEach(layer => {
      style.layers.push(layer);
      style.sources[layer.id] = this.pathSources.get(layer.id)!;
    });
    this.directionLayers.forEach(layer => {
      style.layers.push(layer);
      style.sources[layer.id] = this.directionSources.get(layer.id)!;
    });
  }
}
