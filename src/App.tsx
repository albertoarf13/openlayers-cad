import 'ol/ol.css'
import { MapContainer } from './components/MapContainer'
import type { MapFunctions } from './components/MapContainer'
import { CadToolbar } from './components/CadToolbar'
import { SegmentLengthModal } from './components/SegmentLengthModal'
import { BufferModal } from './components/BufferModal'
import { useRef, useState } from 'react'
import { Tool } from './types'
import type { FeatureId, SelectedSegment } from './types'

function App() {

	const [activeTool, setActiveTool] = useState<Tool | null>(null)
	const [selectedFeatureId, setSelectedFeatureId] = useState<FeatureId | null>(null)
	const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null);
	const [isLengthModalOpen, setIsLengthModalOpen] = useState(false)
	const [isBufferModalOpen, setIsBufferModalOpen] = useState(false)
	const mapFunctionsRef = useRef<MapFunctions>(null)


	return (
		<div>
			<CadToolbar
				activeTool={activeTool}
				onSelectTool={setActiveTool}
				hasSelectedSegment={selectedSegment !== null}
				onShowSegmentLength={() => setIsLengthModalOpen(true)}
				hasSelectedFeature={selectedFeatureId !== null}
				onShowBuffer={() => setIsBufferModalOpen(true)}
			/>

			<MapContainer
				mapFunctions={mapFunctionsRef}
				activeTool={activeTool}
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
		</div>
	)
}

export default App
