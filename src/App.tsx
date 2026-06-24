import 'ol/ol.css'
import { MapContainer } from './components/MapContainer'
import type { MapFunctions } from './components/MapContainer'
import { CadToolbar } from './components/CadToolbar'
import { SegmentLengthModal } from './components/SegmentLengthModal'
import { BufferModal } from './components/BufferModal'
import { SnapOptionsModal } from './components/SnapOptionsModal'
import { useRef, useState } from 'react'
import { Tool } from './types'
import type { FeatureId, SelectedSegment, SnapOptions } from './types'

function App() {

	const [activeTool, setActiveTool] = useState<Tool | null>(null)
	const [selectedFeatureId, setSelectedFeatureId] = useState<FeatureId | null>(null)
	const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null);
	const [isLengthModalOpen, setIsLengthModalOpen] = useState(false)
	const [isBufferModalOpen, setIsBufferModalOpen] = useState(false)
	
	const [isSnapModalOpen, setIsSnapModalOpen] = useState(false)
	const [snapOptions, setSnapOptions] = useState<SnapOptions>({ midpoints: false, vertices: false, lines: false })
	
	const mapFunctionsRef = useRef<MapFunctions>(null)

	const snapEnabled = snapOptions.midpoints || snapOptions.vertices || snapOptions.lines


	return (
		<div>
			<CadToolbar
				activeTool={activeTool}
				onSelectTool={setActiveTool}
				hasSelectedSegment={selectedSegment !== null}
				onShowSegmentLength={() => setIsLengthModalOpen(true)}
				hasSelectedFeature={selectedFeatureId !== null}
				onShowBuffer={() => setIsBufferModalOpen(true)}
				snapEnabled={snapEnabled}
				onShowSnapOptions={() => setIsSnapModalOpen(true)}
			/>

			<MapContainer
				mapFunctions={mapFunctionsRef}
				activeTool={activeTool}
				snapOptions={snapOptions}
				selectedFeatureId={selectedFeatureId}
				onSelectFeature={setSelectedFeatureId}
				selectedSegment={selectedSegment}
				onSelectSegment={setSelectedSegment}
			/>

			{isLengthModalOpen && (
				<SegmentLengthModal
					selectedSegment={selectedSegment}
					onClose={() => setIsLengthModalOpen(false)}
					onSubmit={(length) => mapFunctionsRef.current?.setSegmentLength(length)}
				/>
			)}

			{isBufferModalOpen && (
				<BufferModal
					onClose={() => setIsBufferModalOpen(false)}
					onSubmit={(distance) => mapFunctionsRef.current?.createBuffer(distance)}
				/>
			)}

			{isSnapModalOpen && (
				<SnapOptionsModal
					snapOptions={snapOptions}
					onChange={setSnapOptions}
					onClose={() => setIsSnapModalOpen(false)}
				/>
			)}
		</div>
	)
}

export default App
