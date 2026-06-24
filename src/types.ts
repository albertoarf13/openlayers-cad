
export enum Tool {
    Select,
    SelectSegment,
    DrawPoint,
    DrawLine,
    DrawPolygon,
}


export type FeatureId = string | number


export type SelectedSegment = {
    featureId: FeatureId,
    segmentIndex: number,
    length: number,
}


export type SnapOptions = {
    midpoints: boolean,
    vertices: boolean,
    lines: boolean,
}

