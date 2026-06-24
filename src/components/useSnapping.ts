import VectorSource from "ol/source/Vector";
import { useEffect, useRef } from "react";
import { buildSnapPoints } from "./utils/buildSnapPoints";
import Snap from "ol/interaction/Snap";
import { Feature, Map } from "ol";
import { SnapOptions, Tool } from "../types";



export function useSnapping(
    mapInstanceRef: React.MutableRefObject<Map | null>,
    vectorSourceRef: React.MutableRefObject<VectorSource<Feature> | null>,
    snapOptions: SnapOptions,
    activeTool: Tool | null,
) {

    const snapPointsSourceRef = useRef<VectorSource<Feature> | null>(null)

    if (!snapPointsSourceRef.current) {
        snapPointsSourceRef.current = new VectorSource()
    }
    

    useEffect(() => {

        const vectorSource = vectorSourceRef.current
        const snapPointsSource = snapPointsSourceRef.current
        if (!vectorSource || !snapPointsSource) return

        const rebuild = () => buildSnapPoints(vectorSource, snapPointsSource, snapOptions)

        rebuild()

        vectorSource.on('addfeature', rebuild)
        vectorSource.on('changefeature', rebuild)
        vectorSource.on('removefeature', rebuild)

        return () => {
            vectorSource.un('addfeature', rebuild)
            vectorSource.un('changefeature', rebuild)
            vectorSource.un('removefeature', rebuild)
        }
    }, [snapOptions])


    useEffect(() => {
        const map = mapInstanceRef.current
        const snapPointsSource = snapPointsSourceRef.current
        const anySnapEnabled = snapOptions.midpoints || snapOptions.vertices || snapOptions.lines
        if (!map || !snapPointsSource || !anySnapEnabled) return

        const snap = new Snap({ source: snapPointsSource })
        map.addInteraction(snap)

        return () => {
            map.removeInteraction(snap)
        }
    }, [snapOptions, activeTool])

}