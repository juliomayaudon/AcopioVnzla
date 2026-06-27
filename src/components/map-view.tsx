"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const fixIcons = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

function makeIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative">
        <div style="
          width:44px;height:44px;
          background:#1B3078;
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 14px rgba(27,48,120,0.5);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);color:#00A8E8;font-weight:800;font-size:13px;line-height:1">${count}</span>
        </div>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [20, 44],
    popupAnchor: [2, -44],
  });
}

export interface CentroMapa {
  id: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion?: string;
  bannerUrl?: string;
  latitud: number;
  longitud: number;
  _count: { donaciones: number; usuarios: number };
}

export default function MapView({ centros }: { centros: CentroMapa[] }) {
  useEffect(() => { fixIcons(); }, []);

  const withCoords = centros.filter(c => c.latitud != null && c.longitud != null);
  const center: [number, number] = withCoords.length > 0
    ? [withCoords[0].latitud, withCoords[0].longitud]
    : [10, -66];

  return (
    <MapContainer
      center={center}
      zoom={withCoords.length === 1 ? 6 : 3}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      {withCoords.map((c) => (
        <Marker key={c.id} position={[c.latitud, c.longitud]} icon={makeIcon(c._count.donaciones)}>
          <Popup minWidth={230} maxWidth={260}>
            <div style={{ fontFamily: "system-ui, sans-serif", padding: 0, margin: 0 }}>

              {/* Banner o gradiente */}
              <div style={{
                margin: "-14px -20px 10px -20px",
                height: 110,
                overflow: "hidden",
                position: "relative",
                borderRadius: "8px 8px 0 0",
              }}>
                {c.bannerUrl
                  ? <img src={c.bannerUrl} alt={c.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div style={{
                      width: "100%", height: "100%",
                      background: "linear-gradient(135deg, #1B3078 0%, #1e3a8a 100%)",
                    }} />
                }
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(27,48,120,0.7) 0%, transparent 60%)",
                }} />
                <p style={{
                  position: "absolute", bottom: 8, left: 12,
                  color: "white", fontWeight: 700, fontSize: 14, margin: 0,
                  lineHeight: 1.2, maxWidth: 200,
                }}>{c.nombre}</p>
              </div>

              {/* Dirección completa */}
              <p style={{ fontSize: 12, color: "#555", margin: "0 0 2px 0", lineHeight: 1.4 }}>
                {c.ciudad}, {c.pais}
              </p>
              {c.direccion && (
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px 0", lineHeight: 1.4 }}>
                  {c.direccion}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: "flex", gap: 16, margin: "8px 0", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1B3078" }}>{c._count.donaciones}</span>
                  <span style={{ fontSize: 11, color: "#999", marginLeft: 4 }}>donaciones</span>
                </div>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#00A8E8" }}>{c._count.usuarios}</span>
                  <span style={{ fontSize: 11, color: "#999", marginLeft: 4 }}>voluntarios</span>
                </div>
              </div>

              <a href={`/centro/${c.id}`}
                style={{ display: "block", fontSize: 12, color: "#00A8E8", fontWeight: 600, textDecoration: "none" }}>
                Ver centro →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
