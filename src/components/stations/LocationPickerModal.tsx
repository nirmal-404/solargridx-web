// Smart Solar Microgrid Trading System - Interactive Location Picker Modal
// Enables operators to select latitude and longitude coordinates interactively
// by clicking or dragging a marker on an OpenStreetMap Leaflet map.

import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  X,
  Check,
  Navigation,
  Crosshair,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SolarStation } from '@/types/station';
import 'leaflet/dist/leaflet.css';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onSelectLocation: (lat: number, lng: number) => void;
  existingStations?: SolarStation[];
  stationName?: string;
}

const PRESET_REGIONS = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Mirigama / Meerigama', lat: 7.2436, lng: 80.1293 },
  { name: 'Gampaha', lat: 7.0840, lng: 79.9926 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Negombo', lat: 7.2008, lng: 79.8736 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3623 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
];

export function LocationPickerModal({
  isOpen,
  onClose,
  initialLatitude,
  initialLongitude,
  onSelectLocation,
  existingStations = [],
  stationName,
}: LocationPickerModalProps) {
  // Default to provided coords or Colombo North
  const defaultLat =
    initialLatitude && !isNaN(initialLatitude) ? initialLatitude : 6.9271;
  const defaultLng =
    initialLongitude && !isNaN(initialLongitude) ? initialLongitude : 79.8612;

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const activeMarkerRef = useRef<import('leaflet').Marker | null>(null);

  // Sync initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat =
        initialLatitude && !isNaN(initialLatitude) ? initialLatitude : 6.9271;
      const lng =
        initialLongitude && !isNaN(initialLongitude) ? initialLongitude : 79.8612;
      setSelectedCoords({ lat, lng });
    }
  }, [isOpen, initialLatitude, initialLongitude]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialise Leaflet map when opened
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      // Fix Vite asset URL resolution for default markers
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Cleanup existing map instance if any
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const initialZoom =
        initialLatitude && initialLongitude && !isNaN(initialLatitude) ? 14 : 9;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([selectedCoords.lat, selectedCoords.lng], initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Plot subtle existing stations as reference
      existingStations.forEach((station) => {
        if (!station.latitude || !station.longitude) return;

        // Custom subtle marker icon for surrounding stations
        const existingIcon = L.divIcon({
          className: 'custom-existing-station-marker',
          html: `<div style="
            background: #0284c7;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">⚡ ${station.name || station.stationId}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([station.latitude, station.longitude], {
          icon: existingIcon,
        })
          .addTo(map)
          .bindTooltip(`Station: ${station.name} (${station.stationId})`, {
            direction: 'top',
          });
      });

      // Selected Location Marker (Draggable)
      const activeMarker = L.marker([selectedCoords.lat, selectedCoords.lng], {
        draggable: true,
      }).addTo(map);

      activeMarker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px">
          <strong>${stationName ? stationName : 'New Station Location'}</strong><br/>
          <span style="color:#0284c7;font-weight:600">Drag or click anywhere on the map</span>
        </div>`
      );

      activeMarker.on('drag', (e) => {
        const marker = e.target as import('leaflet').Marker;
        const pos = marker.getLatLng();
        setSelectedCoords({
          lat: parseFloat(pos.lat.toFixed(6)),
          lng: parseFloat(pos.lng.toFixed(6)),
        });
      });

      activeMarker.on('dragend', (e) => {
        const marker = e.target as import('leaflet').Marker;
        const pos = marker.getLatLng();
        setSelectedCoords({
          lat: parseFloat(pos.lat.toFixed(6)),
          lng: parseFloat(pos.lng.toFixed(6)),
        });
      });

      // Click on map to place/move marker
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        activeMarker.setLatLng([newLat, newLng]);
        setSelectedCoords({ lat: newLat, lng: newLng });
      });

      activeMarkerRef.current = activeMarker;
      leafletMapRef.current = map;

      // Invalidate size to ensure complete tile rendering in modal container
      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
        }
      }, 200);
    };

    void initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle preset selection
  const handleSelectPreset = (preset: { lat: number; lng: number }) => {
    setSelectedCoords({ lat: preset.lat, lng: preset.lng });
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([preset.lat, preset.lng], 13);
    }
    if (activeMarkerRef.current) {
      activeMarkerRef.current.setLatLng([preset.lat, preset.lng]);
    }
  };

  // Handle current GPS location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setSelectedCoords({ lat, lng });

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 15);
        }
        if (activeMarkerRef.current) {
          activeMarkerRef.current.setLatLng([lat, lng]);
        }
        setIsLocating(false);
      },
      (err) => {
        setLocateError(`Unable to get location: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Check presets first
    const matchedPreset = PRESET_REGIONS.find((p) =>
      p.name.toLowerCase().includes(query)
    );
    if (matchedPreset) {
      handleSelectPreset(matchedPreset);
      return;
    }

    setIsSearching(true);
    setLocateError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=lk&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        setSelectedCoords({ lat, lng });

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 14);
        }
        if (activeMarkerRef.current) {
          activeMarkerRef.current.setLatLng([lat, lng]);
        }
      } else {
        setLocateError(`Could not find "${searchQuery}" in Sri Lanka.`);
      }
    } catch (err) {
      setLocateError('Search service currently unreachable.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(selectedCoords.lat, selectedCoords.lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl h-[88vh] max-h-[750px] rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Select Station Location
              </h2>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the map, search a town, or drag the pin to set the exact microgrid coordinates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Toolbar: Search, Presets & Geolocation */}
        <div className="flex flex-col gap-2 border-b bg-muted/10 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs min-w-[200px]">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search town (e.g. Meerigama, Galle)..."
                className="w-full rounded-md border border-border bg-background pl-8 pr-14 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1 top-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {isSearching ? '…' : 'Go'}
              </button>
            </form>

            {/* Locate Me Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="h-7 text-xs gap-1.5"
            >
              <Crosshair className={`size-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Locating…' : 'My Current Location'}
            </Button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Navigation className="size-3" /> Quick Jump:
            </span>
            {PRESET_REGIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted hover:border-primary/50 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {locateError && (
          <div className="bg-destructive/10 px-4 py-1.5 text-xs text-destructive border-b border-destructive/20">
            {locateError}
          </div>
        )}

        {/* Interactive Map Area */}
        <div className="relative flex-1 w-full overflow-hidden">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Floating Coordinates Badge */}
          <div className="absolute top-3 right-3 z-[1000] rounded-lg border border-border/80 bg-background/90 backdrop-blur-md px-3 py-2 shadow-lg text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <MapPin className="size-3.5 text-primary" />
              <span>Selected Coordinates</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              Lat: <span className="text-foreground font-medium">{selectedCoords.lat.toFixed(6)}</span> | Lng: <span className="text-foreground font-medium">{selectedCoords.lng.toFixed(6)}</span>
            </div>
          </div>

          {/* Legend / Overlay Note */}
          {existingStations.length > 0 && (
            <div className="absolute bottom-3 left-3 z-[1000] rounded-md border border-border/70 bg-background/85 backdrop-blur-sm px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500 inline-block" />
              <span>{existingStations.length} existing network nodes plotted for reference</span>
            </div>
          )}
        </div>

        {/* Footer with Manual Tweaks & Confirmation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-3 bg-muted/20">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <label htmlFor="modal-lat" className="text-xs text-muted-foreground font-medium">
                Lat:
              </label>
              <input
                id="modal-lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={selectedCoords.lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setSelectedCoords((prev) => ({ ...prev, lat: val }));
                    if (activeMarkerRef.current) activeMarkerRef.current.setLatLng([val, selectedCoords.lng]);
                  }
                }}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="modal-lng" className="text-xs text-muted-foreground font-medium">
                Lng:
              </label>
              <input
                id="modal-lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={selectedCoords.lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setSelectedCoords((prev) => ({ ...prev, lng: val }));
                    if (activeMarkerRef.current) activeMarkerRef.current.setLatLng([selectedCoords.lat, val]);
                  }
                }}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
            >
              <Check className="size-3.5" />
              Apply Coordinates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
