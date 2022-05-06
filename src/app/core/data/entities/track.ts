export interface Track {
    segments: TrackSegment[];
}

export interface TrackSegment {
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
