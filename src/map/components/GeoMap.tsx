import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getPlotNumberMapping,
  getRoads,
  getExistingRoads,
  getOpenSpaces,
  getAmenities,
  getBoundary,
  getGisBounds,
  type LayoutPlotEntry,
  type RegionEntry,
} from "../layouts";
import { STATUS_LABELS, STATUS_FILLS, PLOT_STATUSES, type PlotStatus } from "../models/PlotInformation";
import {
  plotToGeo,
  roadToGeo,
  pathToGeo,
  regionToGeo,
  boundaryToGeo,
  centerOfPoints,
  getGeoBounds,
  ventureGeoBounds,
} from "../geo";

export interface GeoMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  focusOnPlot: (plotId: string) => void;
}

interface Props {
  dbStatusByNumber?: Record<string, PlotStatus>;
  onBook: (plotNumber: string) => void;
}

// Semi-transparent status tints so the muted satellite stays visible through
// plots. Borders stay dark for clear definition on any basemap.
const PLOT_STYLE_FILL: Record<PlotStatus, string> = STATUS_FILLS;

const PLOT_BORDER = "#1e293b";

// Readable vivid status colors for popup/label text on light panels.
const GIS_STATUS_TEXT: Record<PlotStatus, string> = {
  available: "#15803d",
  booked: "#a16207",
  registered: "#1d4ed8",
  sold: "#dc2626",
};

const ROAD_FILL = "#16181d";
const ROAD_EDGE = "#05070a";
const HIGHWAY_FILL = "#0a0c10";
const HIGHWAY_EDGE = "#030507";
const OPEN_SPACE_FILL = "#15803d";
const AMENITY_FILL = "#ea580c";

function effectiveStatus(
  plot: LayoutPlotEntry,
  dbStatusByNumber?: Record<string, PlotStatus>
): PlotStatus {
  const fromDb = dbStatusByNumber?.[plot.plotNumber];
  if (fromDb) return fromDb;
  const fromSource = plot.status;
  if (fromSource === "booked" || fromSource === "registered" || fromSource === "sold") {
    return fromSource;
  }
  return "available";
}

function plotPopupContent(plot: LayoutPlotEntry, status: PlotStatus): string {
  return [
    `<div class="geo-popup">`,
    `<h3>Plot ${plot.plotNumber}</h3>`,
    `<div class="geo-popup-status" style="color:${GIS_STATUS_TEXT[status]}">${STATUS_LABELS[status]}</div>`,
    plot.areaSqYd != null ? `<p>Area: ${plot.areaSqYd} sq.yd</p>` : "",
    plot.dimensions?.width ? `<p>Dims: ${plot.dimensions.width} x ${plot.dimensions.depth}</p>` : "",
    `</div>`,
  ].join("");
}

function bookButton(plotNumber: string): string {
  return `<button class="geo-book-btn" type="button" data-plot="${plotNumber}" style="width:100%;margin-top:8px;padding:9px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">Book this plot now</button>`;
}

function plotLabelIcon(plotNumber: string): L.DivIcon {
  return L.divIcon({
    className: "geo-plot-label",
    html: `<span class="geo-plot-label-text">${plotNumber}</span>`,
    iconSize: [0, 0],
  });
}

function anchorPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "geo-anchor-pin-wrap",
    html:
      '<svg viewBox="0 0 30 38" width="30" height="38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M15 1C7.8 1 2 6.8 2 14c0 9.8 13 23 13 23s13-13.2 13-23C28 6.8 22.2 1 15 1z" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>' +
      '<circle cx="15" cy="14" r="5" fill="#ffffff" stroke="#7f1d1d" stroke-width="1.5"/>' +
      "</svg>",
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -36],
  });
}

function anchorPoint(): [number, number] {
  const gis = getGisBounds();
  if (!gis) return [16.347468, 80.29245];
  return [(gis.minLat + gis.maxLat) / 2, (gis.minLng + gis.maxLng) / 2];
}

function cornerIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "geo-corner-icon-wrap",
    html: `<div class="geo-corner-icon" title="${label} corner">${label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const amenitySvg =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 21h16M6 21V9l6-4 6 4v12M10 21v-4h4v4M7 9h1M11 9h1M15 9h1M7 13h1M11 13h1M15 13h1M7 17h1M11 17h1M15 17h1"/></svg>';

function amenityIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "geo-amenity-icon",
    html: `<div class="geo-amenity-marker" title="${label}">${amenitySvg}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function amenityPopupContent(a: RegionEntry): string {
  return [
    `<div class="geo-popup geo-amenity-popup">`,
    `<h3>${a.label}</h3>`,
    a.type ? `<p class="geo-amenity-type">${a.type.toUpperCase()}</p>` : "",
    `</div>`,
  ].join("");
}

function cornerPopupContent(label: string, lat: number, lng: number): string {
  return [
    `<div class="geo-corner-popup">`,
    `<b>${label}</b>`,
    `<span>Latitude: ${lat.toFixed(4)}°</span>`,
    `<span>Longitude: ${lng.toFixed(4)}°</span>`,
    `</div>`,
  ].join("");
}

const VENTURE_PADDING: L.PointExpression = [40, 40];
const VENTURE_FIT_PADDING: L.PointExpression = [20, 20];
const MAX_ZOOM = 19;

const GeoMap = forwardRef<GeoMapHandle, Props>(function GeoMap({ dbStatusByNumber, onBook }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const plotLayersRef = useRef<Map<string, L.Path>>(new Map());
  const plotByLayerRef = useRef<Map<string, LayoutPlotEntry>>(new Map());
  const highlightRef = useRef<string | null>(null);
  const viewportFitDoneRef = useRef(false);
  const onBookRef = useRef(onBook);
  onBookRef.current = onBook;
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  function handleSearch() {
    const q = query.trim().toUpperCase();
    if (!q) return;
    const plots = getPlotNumberMapping();
    const exact = plots.find((p) => p.plotNumber.toUpperCase() === q);
    const target = exact ?? plots.find((p) => p.plotNumber.toUpperCase().includes(q));
    if (!target) {
      setSearchResult("notfound");
      return;
    }
    pinToPlot(target);
    plotLayersRef.current.get(target.id)?.openPopup();
    setSearchResult("found");
  }

  function plotStyle(
    plot: LayoutPlotEntry,
    status: PlotStatus,
    highlighted: boolean
  ): L.PathOptions {
    return {
      color: highlighted ? "#fde047" : "#1e293b",
      weight: highlighted ? 3.6 : 2.2,
      fillColor: PLOT_STYLE_FILL[status],
      fillOpacity: highlighted ? 0.85 : 0.68,
      lineJoin: "round",
    };
  }

  function applyHighlight(highlightId: string | null) {
    plotLayersRef.current.forEach((layer, id) => {
      const plot = plotByLayerRef.current.get(id);
      if (!plot) return;
      const status = effectiveStatus(plot, dbStatusByNumber);
      layer.setStyle(plotStyle(plot, status, id === highlightId));
      if (id === highlightId) layer.bringToFront();
    });
  }

  // Fit the whole venture precisely into the viewport (tight fit with a small
  // margin), then let the user zoom in/out freely. Used on initial load and by
  // the "Fit" / "All plots" buttons.
  function fitView() {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    const vb = ventureGeoBounds();
    if (!vb) return;
    const bounds = L.latLngBounds([
      [vb.minLat, vb.minLng],
      [vb.maxLat, vb.maxLng],
    ]);
    map.fitBounds(bounds, {
      padding: VENTURE_FIT_PADDING,
      maxZoom: MAX_ZOOM,
      animate: false,
    });
  }

  // Pinpoint: zoom to the plot's location and place the layout around it. The
  // plot is fully visible and centered, and the view steps back one level so the
  // surrounding venture layout (roads/neighbouring plots) stays in frame.
  function pinToPlot(plot: LayoutPlotEntry) {
    const map = mapRef.current;
    if (!map) return;
    const pts = plotToGeo(plot);
    if (pts.length > 0) {
      const plotBounds = L.latLngBounds(pts.map(([la, ln]) => L.latLng(la, ln)));
      map.fitBounds(plotBounds, { padding: VENTURE_PADDING, maxZoom: 19 });
      const focusZoom = Math.max(15, Math.min(map.getZoom(), 19) - 1);
      map.setView(plotBounds.getCenter(), focusZoom, { animate: true });
    }
    highlightRef.current = plot.id;
    applyHighlight(plot.id);
  }

  // Mount once: satellite basemap first so imagery is the map's background.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    // React StrictMode remounts effects in dev (mount -> cleanup -> mount).
    // The flag must start fresh for the LIVE map instance, otherwise the
    // discarded first map "consumes" the one-time auto-fit.
    viewportFitDoneRef.current = false;
    const geo = getGeoBounds();
    const map = L.map(container, {
      center: geo ? [geo.center.lat, geo.center.lng] : [16.347468, 80.29245],
      zoom: 17,
      attributionControl: true,
      zoomControl: false,
    });

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      }
    );
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    satelliteLayer.addTo(map);

    L.control
      .layers({ Satellite: satelliteLayer, Streets: osmLayer }, {}, { position: "bottomleft" })
      .addTo(map);

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setCursor({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.on("mouseout", () => setCursor(null));

    mapRef.current = map;
    overlayRef.current = L.layerGroup().addTo(map);

    // Keep the map sized in sync with its container. Also give the container a
    // final non-zero size before the initial auto-fit so fitBounds doesn't
    // compute a wrongly low zoom (the classic "zoomed-out on refresh" bug).
    const resizeObserver = new ResizeObserver(() => {
      const m = mapRef.current;
      if (!m) return;
      m.invalidateSize();
      if (!viewportFitDoneRef.current && m.getSize().x > 0 && m.getSize().y > 0) {
        viewportFitDoneRef.current = true;
        fitView();
      }
    });
    resizeObserver.observe(container);

    // Re-measure once the container has its final layout size. The auto-fit
    // itself is gated on a real, non-zero container size (see draw effect) so
    // the first fit always targets the full layout bounds.
    map.whenReady(() => requestAnimationFrame(() => map.invalidateSize()));

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      plotLayersRef.current.clear();
      plotByLayerRef.current.clear();
    };
  }, []);

  // Draw all geographic venture layers. Runs again only when statuses change.
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;
    overlay.clearLayers();
    plotLayersRef.current.clear();
    plotByLayerRef.current.clear();
    const statusMap = dbStatusByNumber || {};
    const hl = highlightRef.current;

    const handleBookClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest(".geo-book-btn") as HTMLElement | null;
      if (!btn) return;
      const plotNumber = btn.dataset.plot;
      if (plotNumber) onBookRef.current(plotNumber);
    };
    document.addEventListener("click", handleBookClick);

    // GPS corner reference markers (NW / NE / SE / SW).
    const geo = getGeoBounds();
    if (geo) {
      const corners: Array<{ lat: number; lng: number; label: string }> = [
        { lat: geo.maxLat, lng: geo.minLng, label: "NW" },
        { lat: geo.maxLat, lng: geo.maxLng, label: "NE" },
        { lat: geo.minLat, lng: geo.maxLng, label: "SE" },
        { lat: geo.minLat, lng: geo.minLng, label: "SW" },
      ];
      for (const c of corners) {
        L.marker([c.lat, c.lng], { icon: cornerIcon(c.label), keyboard: false })
          .bindPopup(cornerPopupContent(c.label, c.lat, c.lng), { maxWidth: 230, closeButton: true })
          .addTo(overlay);
      }
    }

    // Anchor pin at the venture's exact centre (16.3194, 80.3445).
    {
      const anchor = anchorPoint();
      L.marker(anchor, { icon: anchorPinIcon(), keyboard: false, zIndexOffset: 1000 })
        .bindPopup(
          `<div class="geo-popup geo-anchor-popup"><h3>Karthikeya Infra CES</h3><b>Venture centre</b><span>Latitude: ${anchor[0].toFixed(4)}°</span><span>Longitude: ${anchor[1].toFixed(4)}°</span></div>`,
          { maxWidth: 230, closeButton: true }
        )
        .addTo(overlay);
    }

    // Venture boundary: dark casing + strong professional orange outline.
    const boundary = getBoundary();
    const boundaryPts = boundaryToGeo(boundary);
    if (boundaryPts.length > 0) {
      L.polygon(boundaryPts, {
        color: "rgba(5, 8, 13, 0.8)",
        weight: 9,
        fill: false,
        interactive: false,
      }).addTo(overlay);
      L.polygon(boundaryPts, {
        color: "#f97316",
        weight: 3,
        fillColor: "transparent",
        fillOpacity: 0,
        lineJoin: "round",
      })
        .bindTooltip("Venture boundary", { sticky: true })
        .addTo(overlay);
    }

    // Open spaces: richer green translucent fill so it stands out on satellite.
    for (const o of getOpenSpaces()) {
      const pts = regionToGeo(o);
      if (pts.length === 0) continue;
      L.polygon(pts, {
        color: "#065f46",
        weight: 1.6,
        fillColor: OPEN_SPACE_FILL,
        fillOpacity: 0.62,
      })
        .bindTooltip(o.label, { sticky: true })
        .addTo(overlay);
    }

    // Amenities: strong amber look to match the professional scheme.
    for (const a of getAmenities()) {
      const pts = regionToGeo(a);
      if (pts.length === 0) continue;
      const content = amenityPopupContent(a);
      L.polygon(pts, {
        color: "#78350f",
        weight: 1.6,
        fillColor: AMENITY_FILL,
        fillOpacity: 0.5,
      })
        .bindTooltip(a.label, { sticky: true })
        .bindPopup(content, { maxWidth: 240 })
        .addTo(overlay);
      const [alat, alng] = centerOfPoints(pts);
      L.marker([alat, alng], { icon: amenityIcon(a.label) })
        .bindPopup(content, { maxWidth: 240 })
        .addTo(overlay);
    }

    // Internal roads: dark charcoal with white dashed centre lines.
    for (const r of getRoads()) {
      const pts = roadToGeo(r);
      if (pts.length === 0) continue;
      L.polygon(pts, {
        color: ROAD_EDGE,
        weight: 1.1,
        fillColor: ROAD_FILL,
        fillOpacity: 0.95,
      })
        .bindTooltip((r.label ?? r.type).toUpperCase(), { sticky: true })
        .addTo(overlay);
      if (r.path && r.path.length > 0) {
        L.polyline(pathToGeo(r.path), {
          color: "#f8fafc",
          weight: 1.4,
          opacity: 0.9,
          dashArray: "6 9",
          interactive: false,
        }).addTo(overlay);
      }
    }

    // Plots: translucent status-tinted fills + always-visible labels + popups.
    for (const p of getPlotNumberMapping()) {
      const pts = plotToGeo(p);
      if (pts.length === 0) continue;
      const status = effectiveStatus(p, statusMap);
      const [clat, clng] = centerOfPoints(pts);
      const content = plotPopupContent(p, status);
      const popupContent =
        status === "available" ? `${content}${bookButton(p.plotNumber)}` : content;

      const layer = L.polygon(pts, plotStyle(p, status, p.id === hl));
      layer
        .bindTooltip(`Plot ${p.plotNumber} — ${STATUS_LABELS[status]}`, { sticky: true })
        .bindPopup(popupContent, { maxWidth: 260 })
        .on("click", () => pinToPlot(p))
        .addTo(overlay);
      plotLayersRef.current.set(p.id, layer);
      plotByLayerRef.current.set(p.id, p);

      L.marker([clat, clng], { icon: plotLabelIcon(p.plotNumber), interactive: false }).addTo(overlay);
    }

    // Main external road / highway: sits over the venture's east flank.
    for (const r of getExistingRoads()) {
      const pts = roadToGeo(r);
      if (pts.length === 0) continue;
      L.polygon(pts, {
        color: HIGHWAY_EDGE,
        weight: 1.4,
        fillColor: HIGHWAY_FILL,
        fillOpacity: 1,
      })
        .bindTooltip((r.label ?? r.type).toUpperCase(), { sticky: true })
        .addTo(overlay);
      if (r.path && r.path.length > 0) {
        L.polyline(pathToGeo(r.path), {
          color: "#d1d5db",
          weight: 1.2,
          opacity: 0.65,
          dashArray: "10 10",
          interactive: false,
        }).addTo(overlay);
      }
    }

    // First draw: auto-fit the camera to the actual venture geometry bounds so
    // the layout fills the viewport on page load. Guarded against a not-yet
    // sized container: if the map reports a zero/undefined size, retry briefly
    // instead of computing a badly zoomed-out fit. Skipped on later status-only
    // re-draws so it never overrides the user's pan/zoom.
    if (!viewportFitDoneRef.current) {
      let tries = 0;
      const attempt = () => {
        if (viewportFitDoneRef.current) return;
        const m = mapRef.current;
        if (!m) return;
        m.invalidateSize();
        const s = m.getSize();
        if (s.x > 0 && s.y > 0) {
          viewportFitDoneRef.current = true;
          fitView();
        } else if (tries < 30) {
          tries += 1;
          setTimeout(attempt, 60);
        }
      };
      attempt();
    }

    return () => {
      document.removeEventListener("click", handleBookClick);
    };
  }, [dbStatusByNumber]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    fit: () => fitView(),
    focusOnPlot: (plotId: string) => {
      const map = mapRef.current;
      if (!map) return;
      const plot = plotByLayerRef.current.get(plotId);
      if (plot) {
        pinToPlot(plot);
        plotLayersRef.current.get(plotId)?.openPopup();
      } else {
        const fallback = getPlotNumberMapping().find((pl) => pl.id === plotId);
        if (!fallback) return;
        pinToPlot(fallback);
      }
    },
  }));

  return (
    <>
      <div ref={containerRef} className="geo-map" />
      <div className="geo-toolbar" role="toolbar" aria-label="Map controls">
        <button className="geo-tool-btn" onClick={() => mapRef.current?.zoomIn()} title="Zoom in" aria-label="Zoom in">
          +
        </button>
        <button className="geo-tool-btn" onClick={() => mapRef.current?.zoomOut()} title="Zoom out" aria-label="Zoom out">
          −
        </button>
        <button className="geo-tool-btn" onClick={fitView} title="Fit the venture to the screen">
          Fit
        </button>
        <button className="geo-tool-btn" onClick={fitView} title="Show all plots">
          All plots
        </button>
      </div>
      <div className="geo-legend" aria-hidden="true">
        <span className="geo-legend-title">Plot Status</span>
        {PLOT_STATUSES.map((s) => (
          <span key={s} className="geo-legend-row">
            <span className="geo-legend-dot" style={{ background: PLOT_STYLE_FILL[s] }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
      <div className="geo-gis-chip">
        <b>Karthikeya Infra CES</b>
        <span className="gis-chip-title">GIS MAP</span>
        {(() => {
          const gis = getGisBounds();
          return gis ? (
            <>
              <span className="gis-chip-coord">
                {gis.minLat.toFixed(4)}°–{gis.maxLat.toFixed(4)}° N
              </span>
              <span className="gis-chip-coord">
                {gis.minLng.toFixed(4)}°–{gis.maxLng.toFixed(4)}° E
              </span>
            </>
          ) : null;
        })()}
      </div>
      <div className="geo-search" role="search" aria-label="Plot search">
        <input
          className="geo-search-input"
          type="text"
          placeholder="Search plot number…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button className="geo-search-btn" onClick={handleSearch} aria-label="Search plot">
          Go
        </button>
        {searchResult === "found" ? (
          <span className="geo-search-result">Found</span>
        ) : searchResult === "notfound" ? (
          <span className="geo-search-result geo-search-miss">Not found</span>
        ) : null}
      </div>
      <div className="geo-cursor-coords">
        {cursor ? (
          <>
            <span>LAT: {cursor.lat.toFixed(6)}</span>
            <span>LNG: {cursor.lng.toFixed(6)}</span>
          </>
        ) : (
          <span className="geo-cursor-hint">Move over the map</span>
        )}
      </div>
    </>
  );
});

export default GeoMap;