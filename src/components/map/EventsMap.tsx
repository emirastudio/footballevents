"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";
import Supercluster, { type ClusterFeature, type PointFeature } from "supercluster";
import { SlidersHorizontal } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { EventMapPopup, type EventPin } from "./EventMapPopup";

// CARTO Voyager — warmer, more colourful than Positron. Free, no API key.
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const CATEGORY_COLORS: Record<string, string> = {
  tournaments:   "#00D26A",
  camps:         "#3B82F6",
  festivals:     "#F59E0B",
  masterclasses: "#8B5CF6",
  "match-tours": "#EF4444",
  showcases:     "#EC4899",
};

type RawFeature = GeoJSON.Feature<GeoJSON.Point, EventPin>;
type ClusterPoint = ClusterFeature<EventPin> | PointFeature<EventPin>;

type ViewState = { longitude: number; latitude: number; zoom: number };

type Props = {
  locale: string;
  onAreaFilter?: (bounds: [number, number, number, number]) => void;
};

/** Cluster bubble: navy gradient with gold count */
function ClusterMarker({ count, onClick }: { count: number; onClick: () => void }) {
  const size = count < 10 ? 36 : count < 50 ? 44 : count < 200 ? 52 : 62;
  const fontSize = count < 100 ? 13 : 11;

  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size }}
      className="group relative flex cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
      aria-label={`${count} events`}
    >
      {/* Outer glow ring */}
      <span
        className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: "#00D26A", transform: "scale(1.35)", filter: "blur(4px)" }}
      />
      {/* Main circle */}
      <span
        className="absolute inset-0 rounded-full shadow-lg"
        style={{ background: "linear-gradient(135deg, #0A1628 0%, #1a2f50 100%)" }}
      />
      {/* Gold ring */}
      <span
        className="absolute rounded-full"
        style={{ inset: -2, border: "2px solid #D4AF37", borderRadius: "50%" }}
      />
      <span
        className="relative z-10 font-bold text-white"
        style={{ fontSize }}
      >
        {count >= 1000 ? `${Math.floor(count / 1000)}k` : count}
      </span>
    </button>
  );
}

/** Single event pin — logo avatar or category dot */
function EventMarker({
  event,
  isActive,
  onClick,
}: {
  event: EventPin;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = CATEGORY_COLORS[event.categorySlug] ?? "#00D26A";

  return (
    <button
      onClick={onClick}
      aria-label={event.title}
      className="group relative flex cursor-pointer flex-col items-center transition-transform hover:scale-110 active:scale-95"
      style={{ transform: isActive ? "scale(1.15)" : undefined }}
    >
      {/* Avatar circle */}
      <div
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-lg transition-all"
        style={{
          border: `2.5px solid ${isActive ? "#D4AF37" : "white"}`,
          background: event.logoUrl ? undefined : color,
          boxShadow: isActive
            ? `0 0 0 3px ${color}55, 0 4px 12px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {event.logoUrl ? (
          <img
            src={event.logoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4" aria-hidden>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        )}
      </div>
      {/* Pointer tip */}
      <div
        className="h-1.5 w-0.5 rounded-b-full"
        style={{ backgroundColor: isActive ? "#D4AF37" : "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}

export function EventsMap({ locale, onAreaFilter }: Props) {
  const mapRef = useRef<MapRef>(null);
  const scRef = useRef<Supercluster<EventPin>>(
    new Supercluster({ radius: 55, maxZoom: 14, minPoints: 2 })
  );

  const [features, setFeatures] = useState<RawFeature[]>([]);
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const [viewport, setViewport] = useState<ViewState>({ longitude: 15, latitude: 50, zoom: 4 });
  const [popup, setPopup] = useState<{ event: EventPin; lng: number; lat: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/map")
      .then((r) => r.json())
      .then((geojson: GeoJSON.FeatureCollection<GeoJSON.Point, EventPin>) => {
        scRef.current.load(geojson.features);
        setFeatures(geojson.features);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateClusters = useCallback(() => {
    const map = mapRef.current;
    if (!map || features.length === 0) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const zoom = Math.round(map.getZoom());
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(),
    ];
    setClusters(scRef.current.getClusters(bbox, zoom) as ClusterPoint[]);
  }, [features]);

  useEffect(() => { updateClusters(); }, [updateClusters, viewport]);

  const handleClusterClick = useCallback((clusterId: number, lng: number, lat: number) => {
    const zoom = Math.min(scRef.current.getClusterExpansionZoom(clusterId), 20);
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 600 });
  }, []);

  const handleFilterArea = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onAreaFilter) return;
    const b = map.getBounds();
    if (b) onAreaFilter([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, [onAreaFilter]);

  return (
    <div className="relative h-full w-full min-h-[500px]">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "#0A1628", borderTopColor: "transparent" }}
            />
            <span className="text-xs font-medium text-[#0A1628]/60">Loading events…</span>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        {...viewport}
        onMove={(e) => setViewport(e.viewState)}
        onMoveEnd={updateClusters}
        onLoad={updateClusters}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {clusters.map((item) => {
          const [lng, lat] = item.geometry.coordinates;
          const props = item.properties;

          if ("cluster" in props && props.cluster) {
            const cp = props as ClusterFeature<EventPin>["properties"];
            return (
              <Marker key={`c-${cp.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <ClusterMarker
                  count={cp.point_count}
                  onClick={() => handleClusterClick(cp.cluster_id, lng, lat)}
                />
              </Marker>
            );
          }

          const event = props as EventPin;
          return (
            <Marker key={event.id} longitude={lng} latitude={lat} anchor="bottom">
              <EventMarker
                event={event}
                isActive={popup?.event.id === event.id}
                onClick={() => setPopup({ event, lng, lat })}
              />
            </Marker>
          );
        })}

        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            offset={20}
            closeButton={false}
            onClose={() => setPopup(null)}
            className="map-popup-custom"
          >
            <EventMapPopup event={popup.event} locale={locale} onClose={() => setPopup(null)} />
          </Popup>
        )}
      </Map>

      {/* Attribution */}
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] text-gray-500 backdrop-blur-sm">
        ©{" "}
        <a href="https://www.openstreetmap.org/copyright" className="pointer-events-auto underline" target="_blank" rel="noreferrer">OSM</a>{" "}
        ©{" "}
        <a href="https://carto.com/attributions" className="pointer-events-auto underline" target="_blank" rel="noreferrer">CARTO</a>
      </div>

      {/* Filter this area */}
      {onAreaFilter && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={handleFilterArea}
            className="flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-5 py-2.5 text-xs font-semibold text-[#0A1628] shadow-xl backdrop-blur-sm transition-all hover:bg-white hover:shadow-2xl"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: "#00D26A" }} />
            Filter this area
          </button>
        </div>
      )}
    </div>
  );
}
