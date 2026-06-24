import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import Select from 'ol/interaction/Select'
import Snap from 'ol/interaction/Snap'
import type Interaction from 'ol/interaction/Interaction'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import GeoJSON from 'ol/format/GeoJSON'
import { buffer } from '@turf/turf'
import { closestOnSegment, squaredDistance } from 'ol/coordinate'
import type { Coordinate } from 'ol/coordinate'
import { getLength } from 'ol/sphere'
import Style from 'ol/style/Style'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import CircleStyle from 'ol/style/Circle'
import 'ol/ol.css'
import { Tool } from '../types'
import type { FeatureId, SelectedSegment } from '../types'


export type MapFunctions = {
    setSegmentLength: (length: number) => void
    createBuffer: (distance: number) => void
}

type Props = {
    activeTool: Tool | null
    selectedFeatureId: FeatureId | null
    onSelectFeature: (id: FeatureId | null) => void
    selectedSegment: SelectedSegment | null
    onSelectSegment: (segment: SelectedSegment | null) => void
    snapToCenter: boolean
    mapFunctions: Ref<MapFunctions>
}

const selectedStyle = new Style({
    fill: new Fill({ color: 'rgba(0, 180, 0, 0.3)' }),
    stroke: new Stroke({ color: '#00b400', width: 3 }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#00b400' }),
    }),
})

const segmentStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 0, 0, 0.3)' }),
    stroke: new Stroke({ color: '#ff0000', width: 3 }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#ff0000' }),
    }),
})

const geoJson = new GeoJSON()

export function MapContainer({ activeTool, selectedFeatureId, onSelectFeature, selectedSegment, onSelectSegment, snapToCenter, mapFunctions }: Props) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<Map | null>(null)
    const vectorSourceRef = useRef<VectorSource | null>(null)
    const segmentSourceRef = useRef<VectorSource | null>(null)
    const midpointSourceRef = useRef<VectorSource | null>(null)


    useEffect(() => {
        if (!mapRef.current) return

        const vectorSource = new VectorSource()

        vectorSource.on('addfeature', (e) => {
            if (e.feature && e.feature.getId() === undefined) {
                e.feature.setId(crypto.randomUUID())
            }
        })


        const segmentSource = new VectorSource();

        const midpointSource = new VectorSource();

        const updateMidpoints = () => {
            midpointSource.clear()

            vectorSource.getFeatures().forEach((feature) => {
                const geometry = feature.getGeometry()
                if (!(geometry instanceof LineString)) return

                const coords = geometry.getCoordinates()
                for (let i = 0; i < coords.length - 1; i++) {
                    const start = coords[i]
                    const end = coords[i + 1]
                    const midpoint: Coordinate = [
                        (start[0] + end[0]) / 2,
                        (start[1] + end[1]) / 2,
                    ]
                    midpointSource.addFeature(new Feature(new Point(midpoint)))
                }
            })
        }

        vectorSource.on('addfeature', updateMidpoints)
        vectorSource.on('changefeature', updateMidpoints)
        vectorSource.on('removefeature', updateMidpoints)


        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
                new VectorLayer({
                    source: vectorSource,
                }),
                new VectorLayer({
                    source: segmentSource,
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        })

        mapInstanceRef.current = map
        vectorSourceRef.current = vectorSource
        segmentSourceRef.current = segmentSource
        midpointSourceRef.current = midpointSource

        return () => {
            map.setTarget(undefined)
            vectorSource.un('addfeature', updateMidpoints)
            vectorSource.un('changefeature', updateMidpoints)
            vectorSource.un('removefeature', updateMidpoints)
            mapInstanceRef.current = null
            vectorSourceRef.current = null
            segmentSourceRef.current = null
            midpointSourceRef.current = null
        }
    }, [])


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


    useEffect(() => {
        const map = mapInstanceRef.current
        const midpointSource = midpointSourceRef.current
        if (!map || !midpointSource || !snapToCenter) return

        const snap = new Snap({ source: midpointSource })
        map.addInteraction(snap)

        return () => {
            map.removeInteraction(snap)
        }
    }, [snapToCenter, activeTool])



    useEffect(() => {
        const source = vectorSourceRef.current
        if (!source) return

        source.getFeatures().forEach((feature) => {
            feature.setStyle(feature.getId() === selectedFeatureId ? selectedStyle : undefined)
        })
    }, [selectedFeatureId])


    useEffect(() => {
        const source = vectorSourceRef.current
        const segmentSource = segmentSourceRef.current
        if (!source || !segmentSource) return

        segmentSource.clear()
        if (!selectedSegment) return

        const feature = source.getFeatureById(selectedSegment.featureId)
        const geometry = feature?.getGeometry()
        if (!(geometry instanceof LineString)) return

        const coords = geometry.getCoordinates()
        const start = coords[selectedSegment.segmentIndex]
        const end = coords[selectedSegment.segmentIndex + 1]
        if (!start || !end) return

        const segmentFeature = new Feature(new LineString([start, end]))
        segmentFeature.setStyle(segmentStyle)
        segmentSource.addFeature(segmentFeature)
    }, [selectedSegment])


    useImperativeHandle(mapFunctions, () => ({
        setSegmentLength(newLength) {
            
            const source = vectorSourceRef.current
            if (!source || !selectedSegment || !Number.isFinite(newLength) || newLength <= 0) return

            const feature = source.getFeatureById(selectedSegment.featureId)
            const geometry = feature?.getGeometry()
            if (!(geometry instanceof LineString)) return

            const coords = geometry.getCoordinates()
            const start = coords[selectedSegment.segmentIndex]
            const end = coords[selectedSegment.segmentIndex + 1]
            if (!start || !end) return

            const currentLength = getLength(new LineString([start, end]))
            if (currentLength === 0) return

            const ratio = newLength / currentLength
            const newEnd: Coordinate = [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio,
            ]

            coords[selectedSegment.segmentIndex + 1] = newEnd
            geometry.setCoordinates(coords)

            const updatedLength = getLength(new LineString([start, newEnd]))

            onSelectSegment({ ...selectedSegment, length: updatedLength })
        },
        createBuffer(distance) {

            const source = vectorSourceRef.current
            if (!source || selectedFeatureId === null || !Number.isFinite(distance) || distance <= 0) return

            const feature = source.getFeatureById(selectedFeatureId)
            const geometry = feature?.getGeometry()
            if (!feature || !geometry) return

            const geojsonGeom = geoJson.writeGeometryObject(geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            })
            if (geojsonGeom.type === 'GeometryCollection') return

            const buffered = buffer(geojsonGeom, distance, { units: 'meters' })
            if (!buffered) return

            const olGeom = geoJson.readGeometry(buffered.geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            })

            feature.setGeometry(olGeom)
        },
    }), [selectedSegment, onSelectSegment, selectedFeatureId])


    return <div ref={mapRef} className="h-screen w-screen" />
}
