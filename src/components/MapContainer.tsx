import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import Select from 'ol/interaction/Select'
import type Interaction from 'ol/interaction/Interaction'
import Style from 'ol/style/Style'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import CircleStyle from 'ol/style/Circle'
import 'ol/ol.css'
import { Tool } from '../types'
import type { FeatureId } from '../types'


type Props = {
    activeTool: Tool | null
    selectedFeatureId: FeatureId | null
    onSelectFeature: (id: FeatureId | null) => void
}

const selectedStyle = new Style({
    fill: new Fill({ color: 'rgba(0, 180, 0, 0.3)' }),
    stroke: new Stroke({ color: '#00b400', width: 3 }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#00b400' }),
    }),
})

export function MapContainer({ activeTool, selectedFeatureId, onSelectFeature }: Props) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<Map | null>(null)
    const vectorSourceRef = useRef<VectorSource | null>(null)


    useEffect(() => {
        if (!mapRef.current) return

        const vectorSource = new VectorSource()

        vectorSource.on('addfeature', (e) => {
            if (e.feature && e.feature.getId() === undefined) {
                e.feature.setId(crypto.randomUUID())
            }
        })

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
                new VectorLayer({
                    source: vectorSource,
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        })

        mapInstanceRef.current = map
        vectorSourceRef.current = vectorSource

        return () => {
            map.setTarget(undefined)
            mapInstanceRef.current = null
            vectorSourceRef.current = null
        }
    }, [])


    useEffect(() => {
        const map = mapInstanceRef.current
        const source = vectorSourceRef.current
        if (!map || !source || activeTool === null) return


        let interaction: Interaction;

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
            map.removeInteraction(interaction)
        }
    }, [activeTool, onSelectFeature])



    useEffect(() => {
        const source = vectorSourceRef.current
        if (!source) return

        source.getFeatures().forEach((feature) => {
            feature.setStyle(feature.getId() === selectedFeatureId ? selectedStyle : undefined)
        })
    }, [selectedFeatureId])


    return <div ref={mapRef} className="h-screen w-screen" />
}
