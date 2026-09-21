// Smart Solar Microgrid Trading System - Node Map Page
// Renders a Leaflet.js map plotting all active solar station nodes from the API.
// Chosen over Google Maps JS API because Leaflet is open-source and requires
// no frontend API key (the Android app already uses Google Maps SDK natively).
// Clicking a marker opens a popup with station name, capacity, battery slots, and status.
import { useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw, AlertCircle, Zap, Server } from 'lucide-react';
import { stationSlotService } from '@/services/stationSlotService';
import { parseApiError } from '@/utils/errorParser';
import type { SolarStation } from '@/types/station';

// Leaflet CSS must be loaded; import it here so Vite bundles it.
import 'leaflet/dist/leaflet.css';

export function NodeMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);

  const [stations, setStations] = useState<SolarStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialise Leaflet map on first mount.
  useEffect(() => {
    let map: import('leaflet').Map;

    const init = async () => {
      // Dynamic import keeps Leaflet out of the SSR path if ever needed.
      const L = await import('leaflet');

      // Fix the broken default icon paths that Vite removes from the bundle.
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || leafletMapRef.current) return;

      // Centre on Sri Lanka by default — adjust to your deployment region.
      map = L.map(mapRef.current, { zoomControl: true }).setView([7.8731, 80.7718], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    };

    void init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Load stations and place markers whenever data updates.
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await stationSlotService.getStations(false); // active only
        setStations(data);

        if (!leafletMapRef.current) return;
        const L = await import('leaflet');

        // Clear previous markers before re-plotting.
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        data.forEach((station) => {
          if (!leafletMapRef.current) return;
          const marker = L.marker([station.latitude, station.longitude])
            .addTo(leafletMapRef.current!)
            .bindPopup(
              `<div style="min-width:180px;font-family:sans-serif;font-size:13px">
                <strong style="font-size:14px">${station.name}</strong>
                <br/><span style="color:#6b7280;font-size:11px;font-family:monospace">${station.stationId}</span>
                <hr style="margin:6px 0;border-color:#e5e7eb"/>
                <div style="display:flex;flex-direction:column;gap:3px">
                  <span>⚡ <strong>${station.capacityKwh}</strong> kWh capacity</span>
                  <span>🔋 <strong>${station.availableBatteryStorageSlots}</strong> battery slots</span>
                  <span>📍 ${station.latitude.toFixed(5)}, ${station.longitude.toFixed(5)}</span>
                  <span style="margin-top:4px">
                    <span style="
                      display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:600;
                      background:${station.status === 'Active' ? '#d1fae5' : '#f3f4f6'};
                      color:${station.status === 'Active' ? '#065f46' : '#374151'}
                    ">${station.status}</span>
                  </span>
                </div>
              </div>`,
              { maxWidth: 260 }
            );
          markersRef.current.push(marker);
        });

        // Auto-fit bounds if we have markers.
        if (markersRef.current.length > 0 && leafletMapRef.current) {
          const group = L.featureGroup(markersRef.current);
          leafletMapRef.current.fitBounds(group.getBounds().pad(0.2));
        }
      } catch (err) {
        setError(parseApiError(err, 'Failed to load station data.'));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleRefresh = async () => {
    // Re-trigger marker placement by re-running the effect manually.
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationSlotService.getStations(false);
      setStations(data);

      if (!leafletMapRef.current) return;
      const L = await import('leaflet');
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      data.forEach((station) => {
        if (!leafletMapRef.current) return;
        const marker = L.marker([station.latitude, station.longitude])
          .addTo(leafletMapRef.current!)
          .bindPopup(
            `<div style="min-width:180px;font-family:sans-serif;font-size:13px">
              <strong>${station.name}</strong> (${station.stationId})<br/>
              ⚡ ${station.capacityKwh} kWh &nbsp; 🔋 ${station.availableBatteryStorageSlots} slots<br/>
              <em>${station.status}</em>
            </div>`
          );
        markersRef.current.push(marker);
      });
    } catch (err) {
      setError(parseApiError(err, 'Refresh failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Node Map</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live map of active solar microgrid nodes — click a marker for details.
          </p>
        </div>
        <button
          id="btn-refresh-map"
          onClick={() => void handleRefresh()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Map
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs">
          <Server className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground">{stations.length}</span>
          <span className="text-muted-foreground">active nodes</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs">
          <Zap className="size-3.5 text-amber-500" />
          <span className="font-semibold text-foreground">
            {stations.reduce((sum, s) => sum + s.capacityKwh, 0).toFixed(1)}
          </span>
          <span className="text-muted-foreground">total kWh</span>
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="relative rounded-xl border border-border overflow-hidden shadow-sm" style={{ height: '60vh', minHeight: 400 }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" /> Loading map data…
            </div>
          </div>
        )}
        <div ref={mapRef} className="size-full" id="node-map-container" />
      </div>

      {/* ── Station list beneath map ── */}
      {stations.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => (
            <div key={s.stationId} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
              <MapPin className="size-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{s.stationId}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)} · {s.capacityKwh} kWh
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NodeMapPage;
