import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import 'ol/ol.css'
import { Tool } from '../types'


type Props = {
    activeTool: Tool | null
}

export function MapContainer({ activeTool }: Props) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<Map | null>(null)
    const vectorSourceRef = useRef<VectorSource | null>(null)

    useEffect(() => {
        if (!mapRef.current) return

        const vectorSource = new VectorSource()

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


        let drawInteraction: Draw;
        
        switch (activeTool) {

            case Tool.DrawPoint:
                drawInteraction = new Draw({ source, type: 'Point' })
                map.addInteraction(drawInteraction)
                break

            case Tool.DrawLine:
                drawInteraction = new Draw({ source, type: 'LineString' })
                map.addInteraction(drawInteraction)
                break

            case Tool.DrawPolygon:
                drawInteraction = new Draw({ source, type: 'Polygon' })
                map.addInteraction(drawInteraction)
                break

            default:
                return
        }


        return () => {
            map.removeInteraction(drawInteraction)
        }
    }, [activeTool])

    return <div ref={mapRef} className="h-screen w-screen" />
}
