import 'ol/ol.css'
import { MapContainer } from './components/MapContainer'
import { CadToolbar } from './components/CadToolbar'
import { useState } from 'react'
import { Tool } from './types'

function App() {

	const [activeTool, setActiveTool] = useState<Tool | null>(null)

	return (
		<div>
			<CadToolbar activeTool={activeTool} onSelectTool={setActiveTool} />

			<MapContainer activeTool={activeTool} />
		</div>
	)
}

export default App
