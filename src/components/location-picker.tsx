"use client";
import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Loader2, X, AlertCircle } from "lucide-react";

const PIN_ICON = new L.DivIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))">
    <div style="width:22px;height:22px;background:#1B3078;border:3px solid white;border-radius:50%"></div>
    <div style="width:3px;height:10px;background:#1B3078;margin-top:-2px;border-radius:0 0 2px 2px"></div>
  </div>`,
  iconSize: [22, 32],
  iconAnchor: [11, 32],
  className: "",
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyTo({ target }: { target: [number, number] }) {
  const map = useMap();
  map.flyTo(target, 13, { duration: 1 });
  return null;
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPicker({ initialLat, initialLng, onPick }: Props) {
  const defaultCenter: [number, number] =
    initialLat && initialLng ? [initialLat, initialLng] : [7.5, -66.0];

  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handlePick = useCallback((lat: number, lng: number) => {
    const p: [number, number] = [
      Math.round(lat * 100000) / 100000,
      Math.round(lng * 100000) / 100000,
    ];
    setPosition(p);
    setFlyTarget(null);
    setResults([]);
    setSearchDone(false);
    onPick(p[0], p[1]);
  }, [onPick]);

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    setSearchDone(false);
    setSearchError("");
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error("Error del servidor");
      const data = await r.json();
      setResults(data);
      setSearchDone(true);
    } catch (e: any) {
      setSearchError("No se pudo conectar al buscador. Intenta de nuevo.");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: any) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setFlyTarget([lat, lng]);
    handlePick(lat, lng);
    setSearch("");
    setSearchDone(false);
  };

  return (
    <div className="space-y-2">

      {/* Buscador */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              if (!e.target.value) { setResults([]); setSearchDone(false); setSearchError(""); }
            }}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="Ej: Caracas, Venezuela"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3078]/20 focus:border-[#1B3078]"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setResults([]); setSearchDone(false); setSearchError(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !search.trim()}
          className="px-3 py-2 bg-[#1B3078] text-white text-sm rounded-lg hover:bg-[#142360] disabled:opacity-40 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </div>

      {/* Resultados — en flujo normal, no absoluto */}
      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#EEF1FB] border-b border-gray-100 last:border-0 flex items-start gap-2 transition-colors"
            >
              <MapPin size={13} className="text-[#1B3078] shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {searchDone && results.length === 0 && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          No se encontraron resultados. Intenta con otra ciudad o dirección.
        </p>
      )}

      {/* Error de conexión */}
      {searchError && (
        <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {searchError}
        </p>
      )}

      {/* Mapa */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200 cursor-crosshair"
        style={{ height: 280 }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={initialLat && initialLng ? 12 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ClickHandler onPick={handlePick} />
          {flyTarget && <FlyTo target={flyTarget} />}
          {position && (
            <Marker
              position={position}
              icon={PIN_ICON}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  handlePick(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordenadas */}
      <p className="text-xs flex items-center gap-1.5">
        <MapPin size={12} className="text-[#1B3078] shrink-0" />
        {position ? (
          <span className="text-gray-600">
            <strong className="text-gray-800">Lat:</strong> {position[0].toFixed(5)}&nbsp;&nbsp;
            <strong className="text-gray-800">Lng:</strong> {position[1].toFixed(5)}
          </span>
        ) : (
          <span className="text-gray-400">
            Busca una dirección o haz clic en el mapa para fijar la ubicación
          </span>
        )}
      </p>
    </div>
  );
}
