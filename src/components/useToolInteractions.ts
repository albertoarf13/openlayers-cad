import VectorSource from "ol/source/Vector";
import { useEffect } from "react";
import Draw from "ol/interaction/Draw";
import Select from "ol/interaction/Select";
import type Interaction from "ol/interaction/Interaction";
import LineString from "ol/geom/LineString";
import { closestOnSegment, squaredDistance } from "ol/coordinate";
import type { Coordinate } from "ol/coordinate";
import { getLength } from "ol/sphere";
import { Feature, Map } from "ol";
import { Tool } from "../types";
import type { FeatureId, SelectedSegment } from "../types";


export function useToolInteractions(
    mapInstanceRef: React.MutableRefObject<Map | null>,
    vectorSourceRef: React.MutableRefObject<VectorSource<Feature> | null>,
    activeTool: Tool | null,
    onSelectFeature: (id: FeatureId | null) => void,
    onSelectSegment: (segment: SelectedSegment | null) => void,
) {

    useEffect(() => {
        const map = mapInstanceRef.current
        const source = vectorSourceRef.current
        if (!map || !source || activeTool === null) return


        let interaction: Interaction | undefined

        switch (activeTool) {

            case Tool.Select: {

                const select = new Select({ style: null })

                select.on('select', (e) => {
                    const feature = e.selected[0]
                    onSelectFeature(feature ? feature.getId() ?? null : null)
                })

                interaction = select
                map.addInteraction(interaction)
                break
            }

            case Tool.SelectSegment: {

                const select = new Select({ style: null })

                select.on('select', (e) => {

                    const feature = e.selected[0]
                    const featureId = feature?.getId()
                    const geometry = feature?.getGeometry()
                    if (!feature || featureId === undefined || !(geometry instanceof LineString)) {
                        onSelectSegment(null)
                        return
                    }

                    const clickCoord = e.mapBrowserEvent.coordinate
                    const coords = geometry.getCoordinates()

                    let closestSegmentIndex = -1
                    let minDistance = Infinity

                    for (let i = 0; i < coords.length - 1; i++) {
                        const segment: [Coordinate, Coordinate] = [coords[i], coords[i + 1]]
                        const pointOnSegment = closestOnSegment(clickCoord, segment)
                        const distance = squaredDistance(clickCoord, pointOnSegment)
                        if (distance < minDistance) {
                            minDistance = distance
                            closestSegmentIndex = i
                        }
                    }

                    if (closestSegmentIndex === -1) {
                        onSelectSegment(null)
                        return
                    }

                    const length = getLength(
                        new LineString([coords[closestSegmentIndex], coords[closestSegmentIndex + 1]])
                    )

                    onSelectSegment({ featureId, segmentIndex: closestSegmentIndex, length })
                })

                interaction = select
                map.addInteraction(interaction)
                break
            }

            case Tool.DrawPoint:
                interaction = new Draw({ source, type: 'Point' })
                map.addInteraction(interaction)
                break

            case Tool.DrawLine:
                interaction = new Draw({ source, type: 'LineString' })
                map.addInteraction(interaction)
                break

            case Tool.DrawPolygon:
                interaction = new Draw({ source, type: 'Polygon' })
                map.addInteraction(interaction)
                break

            default:
                return
        }


        return () => {
            if (interaction) map.removeInteraction(interaction)
        }
    }, [activeTool, onSelectFeature, onSelectSegment])

}
