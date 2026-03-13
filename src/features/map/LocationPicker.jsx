import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { useState, useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"


delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

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

  return position ? (
  <Marker
    position={position}
    icon={userIcon}
  />
) : null
}

export default function LocationPicker({ onSelect, position, shop }) {

    const shopPosition = shop
  ? [shop.latitude, shop.longitude]
  : [21.03, 105.85]

  return (
    <MapContainer
      center={shopPosition}
      zoom={13}
      style={{ height: "180px", width: "100%" }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      {shop && (
  <Marker
    position={[shop.latitude, shop.longitude]}
    icon={shopIcon}
  />
)}

      <ChangeView position={position} />

{position && (
  <Marker
    position={[position.lat, position.lng]}
    icon={userIcon}
  />
)}

      <Picker onSelect={onSelect} />

    </MapContainer>
  )
}