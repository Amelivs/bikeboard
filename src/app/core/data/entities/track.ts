export interface Track {
    points: TrackPoint[];
}

export interface TrackPoint {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    speed: number;
    timestamp: number;
}
