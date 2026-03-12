import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { useState, useEffect } from "react"

function ChangeView({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16)
    }
  }, [position])

  return null
}

function Picker({ onSelect }) {

  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {

      const loc = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }

      setPosition([loc.lat, loc.lng])

      console.log("User location:", loc)

      onSelect(loc)
    }
  })

  return position ? <Marker position={position} /> : null
}

export default function LocationPicker({ onSelect, position }) {

  return (
    <MapContainer
      center={[21.30825,105.59329]}
      zoom={13}
      style={{ height: "180px", width: "100%" }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      <ChangeView position={position} />

      {position && (
        <Marker position={[position.lat, position.lng]} />
      )}

      <Picker onSelect={onSelect} />

    </MapContainer>
  )
}