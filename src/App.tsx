import 'ol/ol.css'
import { MapContainer } from './components/MapContainer'
import { CadToolbar } from './components/CadToolbar'
import { useState } from 'react'
import { Tool } from './types'
import type { FeatureId, SelectedSegment } from './types'

function App() {

	const [activeTool, setActiveTool] = useState<Tool | null>(null)
	const [selectedFeatureId, setSelectedFeatureId] = useState<FeatureId | null>(null)
	const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null);
	

	return (
		<div>
			<CadToolbar activeTool={activeTool} onSelectTool={setActiveTool} />

			<MapContainer
				activeTool={activeTool}
				selectedFeatureId={selectedFeatureId}
				onSelectFeature={setSelectedFeatureId}
				selectedSegment={selectedSegment}
				onSelectSegment={setSelectedSegment}
			/>
		</div>
	)
}

export default App
