import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const mkIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.25)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 20],
    popupAnchor: [0, -18],
  });

const icon24 = mkIcon('#C1521E');
const iconNormal = mkIcon('#4C5D4B');

export default function ClinicMap({ clinics, height = 560, onSelect }) {
  const center = clinics.length ? [clinics[0].lat, clinics[0].lng] : [20, 0];
  return (
    <div className="rounded-3xl overflow-hidden border border-willow/10" style={{ height }} data-testid="spatial-health-map-canvas">
      <MapContainer center={center} zoom={2} scrollWheelZoom style={{ height: '100%', width: '100%' }} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {clinics.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={c.twenty_four_seven ? icon24 : iconNormal}>
            <Popup>
              <div style={{ fontFamily: 'DM Sans', minWidth: 200 }}>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: 18, fontWeight: 600, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: '#7E8B83', margin: '2px 0' }}>{c.city} · {c.country}</p>
                <p style={{ fontSize: 12, color: '#535E56', margin: '6px 0' }}>{c.specialty}</p>
                <p style={{ fontSize: 12, margin: '6px 0' }}>
                  <strong style={{ color: '#C1521E' }}>{c.trust}</strong> trust · {c.languages.join(', ')}
                </p>
                {c.twenty_four_seven && <span style={{ fontSize: 10, background: '#FBEAE2', color: '#C1521E', padding: '2px 8px', borderRadius: 999 }}>24/7</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
