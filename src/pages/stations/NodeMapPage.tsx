// Smart Solar Microgrid Trading System - Node Map Page
// Renders a Leaflet.js map plotting all active solar station nodes from the API.
// Clicking a card or marker flies directly to that station and opens its details popup.
// Clicking anywhere on the map drops a pointed location pin to inspect coordinates.
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Zap,
  Server,
  Search,
  Compass,
  X,
} from 'lucide-react';
import { stationSlotService } from '@/services/stationSlotService';
import { parseApiError } from '@/utils/errorParser';
import type { SolarStation } from '@/types/station';
import { cn } from '@/lib/utils';

// Leaflet CSS must be loaded; import it here so Vite bundles it.
import 'leaflet/dist/leaflet.css';

export function NodeMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);
  const markersMapRef = useRef<Map<string, import('leaflet').Marker>>(new Map());
  const pointedMarkerRef = useRef<import('leaflet').Marker | null>(null);

  const [stations, setStations] = useState<SolarStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pointedCoords, setPointedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Initialise Leaflet map on first mount.
  useEffect(() => {
    let map: import('leaflet').Map;

    const init = async () => {
      const L = await import('leaflet');

      // Fix the broken default icon paths that Vite removes from the bundle.
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || leafletMapRef.current) return;

      // Centre on Sri Lanka by default
      map = L.map(mapRef.current, { zoomControl: true }).setView([7.8731, 80.7718], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Handle clicking anywhere on the map to inspect or point a new location
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        setPointedCoords({ lat, lng });

        if (pointedMarkerRef.current) {
          pointedMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const pinIcon = L.divIcon({
            className: 'custom-pointed-pin',
            html: `<div style="
              background: #ef4444;
              color: white;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 9999px;
              border: 2px solid white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              font-size: 14px;
            ">📍</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });
          pointedMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        }

        pointedMarkerRef.current
          .bindPopup(
            `<div style="min-width:180px;font-family:sans-serif;font-size:12px">
              <strong style="color:#ef4444;font-size:13px">📍 Pointed Location</strong>
              <hr style="margin:6px 0;border-color:#e5e7eb"/>
              <div style="font-family:monospace;color:#374151;margin-bottom:6px">
                Lat: ${lat}<br/>Lng: ${lng}
              </div>
              <p style="font-size:11px;color:#6b7280;margin:0 0 8px 0">
                Location selected on map.
              </p>
              <a href="/stations" style="
                display: inline-block;
                background: #18181b;
                color: #ffffff;
                padding: 4px 10px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 11px;
                font-weight: 600;
              ">+ Create Station Here</a>
            </div>`
          )
          .openPopup();
      });

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

  // Plot stations on the map
  const plotMarkers = async (stationList: SolarStation[]) => {
    if (!leafletMapRef.current) return;
    const L = await import('leaflet');

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markersMapRef.current.clear();

    stationList.forEach((station) => {
      if (!leafletMapRef.current || !station.latitude || !station.longitude) return;

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

      marker.on('click', () => {
        setSelectedStationId(station.stationId);
      });

      markersRef.current.push(marker);
      markersMapRef.current.set(station.stationId, marker);
    });

    // Auto-fit bounds or focus on stations
    if (markersRef.current.length > 0 && leafletMapRef.current) {
      const group = L.featureGroup(markersRef.current);
      const bounds = group.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // If single point or all markers share identical coordinates
      if (Math.abs(ne.lat - sw.lat) < 0.0001 && Math.abs(ne.lng - sw.lng) < 0.0001) {
        leafletMapRef.current.setView([ne.lat, ne.lng], 13);
      } else {
        leafletMapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
      }
    }
  };

  // Load stations and place markers on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await stationSlotService.getStations(false); // active only
        setStations(data);
        await plotMarkers(data);
      } catch (err) {
        setError(parseApiError(err, 'Failed to load station data.'));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationSlotService.getStations(false);
      setStations(data);
      await plotMarkers(data);
    } catch (err) {
      setError(parseApiError(err, 'Refresh failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Focus and open popup for a specific station on the map
  const handleFocusStation = (station: SolarStation) => {
    setSelectedStationId(station.stationId);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([station.latitude, station.longitude], 15, {
        duration: 1.2,
      });
    }
    const marker = markersMapRef.current.get(station.stationId);
    if (marker) {
      marker.openPopup();
    }
  };

  // Handle Search for a station or Sri Lanka town/place
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || !leafletMapRef.current) return;

    // Check if it matches any station by name or ID
    const matchedStation = stations.find(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.stationId.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedStation) {
      handleFocusStation(matchedStation);
      return;
    }

    // Otherwise geocode via Nominatim for Sri Lanka
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=lk&limit=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(parseFloat(item.lat).toFixed(6));
        const lng = parseFloat(parseFloat(item.lon).toFixed(6));
        leafletMapRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
        setPointedCoords({ lat, lng });

        const L = await import('leaflet');
        if (pointedMarkerRef.current) {
          pointedMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const pinIcon = L.divIcon({
            className: 'custom-pointed-pin',
            html: `<div style="
              background: #ef4444;
              color: white;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 9999px;
              border: 2px solid white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              font-size: 14px;
            ">📍</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });
          pointedMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(
            leafletMapRef.current
          );
        }

        pointedMarkerRef.current
          .bindPopup(
            `<div style="min-width:180px;font-family:sans-serif;font-size:12px">
              <strong style="color:#ef4444;font-size:13px">📍 ${item.display_name.split(',')[0]}</strong>
              <hr style="margin:6px 0;border-color:#e5e7eb"/>
              <div style="font-family:monospace;color:#374151;margin-bottom:6px">
                Lat: ${lat}<br/>Lng: ${lng}
              </div>
              <a href="/stations" style="
                display: inline-block;
                background: #18181b;
                color: #ffffff;
                padding: 4px 10px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 11px;
                font-weight: 600;
              ">+ Create Station Here</a>
            </div>`
          )
          .openPopup();
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.stationId.toLowerCase().includes(q) ||
        `${s.latitude},${s.longitude}`.includes(q)
    );
  }, [stations, searchQuery]);

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
            Live map of active solar microgrid nodes — click any station card or marker to show that part of the map.
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

      {/* ── Search & Stats bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station or town (e.g. Meerigama, Colombo)..."
            className="w-full rounded-lg border border-border bg-background pl-8 pr-16 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1 px-2 py-1 text-[11px] font-medium rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isSearching ? '…' : 'Locate'}
          </button>
        </form>

        {/* Stats strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
            <Server className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground">{stations.length}</span>
            <span className="text-muted-foreground">active nodes</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
            <Zap className="size-3.5 text-amber-500" />
            <span className="font-semibold text-foreground">
              {stations.reduce((sum, s) => sum + s.capacityKwh, 0).toFixed(1)}
            </span>
            <span className="text-muted-foreground">total kWh</span>
          </div>
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="relative rounded-xl border border-border overflow-hidden shadow-sm" style={{ height: '62vh', minHeight: 420 }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" /> Loading map data…
            </div>
          </div>
        )}
        <div ref={mapRef} className="size-full" id="node-map-container" />

        {/* Floating helper badge */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-md border border-border/80 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm flex items-center gap-1.5">
          <Compass className="size-3.5 text-primary" />
          <span>Click any card below or click the map to show that part</span>
        </div>

        {pointedCoords && (
          <div className="absolute top-3 right-3 z-[1000] rounded-lg border border-border/80 bg-background/90 backdrop-blur-md px-3 py-2 shadow-lg text-xs space-y-0.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <MapPin className="size-3.5" />
              <span>Pointed Location</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {pointedCoords.lat.toFixed(5)}, {pointedCoords.lng.toFixed(5)}
            </div>
          </div>
        )}
      </div>

      {/* ── Station list beneath map (Clickable & Highlights Map) ── */}
      {stations.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Solar Microgrid Stations ({filteredStations.length}) — Click to focus on map</span>
            {selectedStationId && (
              <button
                type="button"
                onClick={() => setSelectedStationId(null)}
                className="text-primary hover:underline text-[11px]"
              >
                Clear selection
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStations.map((s) => {
              const isSelected = selectedStationId === s.stationId;
              return (
                <div
                  key={s.stationId}
                  onClick={() => handleFocusStation(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleFocusStation(s);
                  }}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-all duration-200 text-left',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/40'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex size-7 items-center justify-center rounded-md shrink-0 transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                    )}
                  >
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {s.name}
                      </p>
                      <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Show on map →
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{s.stationId}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="font-mono">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</span>
                      <span>·</span>
                      <span>{s.capacityKwh} kWh</span>
                      <span>·</span>
                      <span className={s.status === 'Active' ? 'text-emerald-600 font-medium' : ''}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NodeMapPage;

