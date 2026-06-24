import VectorSource from "ol/source/Vector"
import { SnapOptions } from "../../types"
import { Coordinate } from "ol/coordinate"
import { LineString, Point, Polygon } from "ol/geom"
import { Feature } from "ol"


export function buildSnapPoints(vectorSource: VectorSource, snapPointsSource: VectorSource, options: SnapOptions) {
    
    snapPointsSource.clear()

    vectorSource.getFeatures().forEach((feature) => {
        const geometry = feature.getGeometry()

        let rings: Coordinate[][]
        if (geometry instanceof LineString) {
            rings = [geometry.getCoordinates()]
        } else if (geometry instanceof Polygon) {
            rings = geometry.getCoordinates()
        } else {
            return
        }

        rings.forEach((coords) => {

            for (let i = 0; i < coords.length - 1; i++) {

                const start = coords[i]
                const end = coords[i + 1]

                if (options.vertices) {
                    snapPointsSource.addFeature(new Feature(new Point(start)))
                }

                if (options.midpoints) {
                    const midpoint: Coordinate = [
                        (start[0] + end[0]) / 2,
                        (start[1] + end[1]) / 2,
                    ]
                    snapPointsSource.addFeature(new Feature(new Point(midpoint)))
                }
            }

            if (options.vertices && geometry instanceof LineString) {

                const last = coords[coords.length - 1]
                snapPointsSource.addFeature(new Feature(new Point(last)))
            }
        })

        if (options.lines) {
            snapPointsSource.addFeature(new Feature(geometry.clone()))
        }
    })
}
