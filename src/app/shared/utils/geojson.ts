import { featureCollection, lineString } from '@turf/helpers';


export class GeoJsonUtil {

  public static fromGpx(gpx: string) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpx, 'text/xml');

    // Convert each GPX track segment to a GeoJSON LineString feature
    const features = Array.from(xml.querySelectorAll('trkseg')).map(segment => {
      const points = Array.from(segment.querySelectorAll('trkpt')).map(point => {
        const lat = point.getAttribute('lat')!;
        const lon = point.getAttribute('lon')!;
        return [parseFloat(lon), parseFloat(lat)];
      });
      return lineString(points);
    });

    // Convert GeoJSON LineString features to a GeoJSON feature collection
    return featureCollection(features);
  }
}
