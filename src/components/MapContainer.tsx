import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import GeoJSON from 'ol/format/GeoJSON'
import { buffer } from '@turf/turf'
import type { Coordinate } from 'ol/coordinate'
import { getLength } from 'ol/sphere'
import Style from 'ol/style/Style'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import CircleStyle from 'ol/style/Circle'
import 'ol/ol.css'
import { Tool } from '../types'
import type { FeatureId, SelectedSegment, SnapOptions } from '../types'
import { useSnapping } from './useSnapping'
import { useToolInteractions } from './useToolInteractions'


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
    snapOptions: SnapOptions
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



export function MapContainer({ activeTool, selectedFeatureId, onSelectFeature, selectedSegment, onSelectSegment, snapOptions, mapFunctions }: Props) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<Map | null>(null)
    const vectorSourceRef = useRef<VectorSource | null>(null)
    const segmentSourceRef = useRef<VectorSource | null>(null)


    useEffect(() => {
        if (!mapRef.current) return

        const vectorSource = new VectorSource()

        vectorSource.on('addfeature', (e) => {
            if (e.feature && e.feature.getId() === undefined) {
                e.feature.setId(crypto.randomUUID())
            }
        })


        const segmentSource = new VectorSource();


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

        return () => {
            map.setTarget(undefined)
            mapInstanceRef.current = null
            vectorSourceRef.current = null
            segmentSourceRef.current = null
        }
    }, [])

    

    useToolInteractions(mapInstanceRef, vectorSourceRef, activeTool, onSelectFeature, onSelectSegment)

    useSnapping(mapInstanceRef, vectorSourceRef, snapOptions, activeTool)



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
