import 'ol/ol.css'
import { MapContainer } from './components/MapContainer'
import { CadToolbar } from './components/CadToolbar'



function App() {

  return (
    <div>
      <CadToolbar />

      <MapContainer />
    </div>
  )
}

export default App
