import type { Point } from "../types/dxf";
import plotNumberMapping from "./karthikeya/plotNumberMapping.json";
import roadGeometry from "./karthikeya/roadGeometry.json";
import existingRoadsJson from "./karthikeya/existingRoads.json";
import openSpacesJson from "./karthikeya/openSpaces.json";
import utilitiesJson from "./karthikeya/utilities.json";
import amenitiesJson from "./karthikeya/amenities.json";
import layoutBoundaryJson from "./karthikeya/layoutBoundary.json";

/* -------------------------------------------------------------------------
 * Karthikeya Infra CES layout registry.
 *
 * Architecture mirrors the sibling Merit layout apps (merit-dokiparru,
 * merit-srilakshmi): plain SVG polygons in a local "world unit" vector
 * space (here, feet, matching the source drawing's printed dimensions),
 * panned/zoomed by a hand-rolled usePanZoom hook + a fit-to-viewport
 * convert() computed from the scanned bounds of all geometry -- NOT
 * Leaflet/CRS.Simple/GeoJSON, and NOT CSS-positioned elements. Per-concern
 * data files (plotNumberMapping / roadGeometry / existingRoads / openSpaces
 * / utilities / amenities / layoutBoundary) match plotNumberMapping.json's
 * shape from the reference apps.
 *
 * Source of truth: "WhatsApp Image 2026-09-17 at 4.45.51 PM.jpeg" (AP CRDA
 * in-principle-approved layout for Karthikeya Infra CES, SyNos. 368,
 * 369/B, 369/C, Medikondur Village & Mandal, Guntur District).
 *
 * This pass corrected (see each JSON file's own `precision` notes):
 *  - plots 61/62/63: replaced three independently flat-bottomed rectangles
 *    with one continuous diagonal south edge (matches the source's slanted
 *    dimension callouts and the near-colinear corners the old rectangles
 *    already had).
 *  - west Open Space area label: "Ac:0.156 Cents" -> "Ac:0.456 Cents"
 *    (misread in the prior pass; re-verified at 3x zoom).
 *  - added a 5th survey marker, "LPM 5201", found on the boundary next to
 *    the west Open Space (previously only 4 markers were digitized).
 *  - Kalyanamandapam / LPM-5204 parcel partition line: added the
 *    stepped/zigzag notch visible at 3x zoom (previously a straight line).
 *  - Guntur-Hyderabad highway: re-traced as its own wider, near-black band
 *    (distinct from internal road width/style) with its T-junction to the
 *    internal 33ft road network and the small chevron notches at its
 *    north/south ends where it meets the tree-buffer strip.
 *
 * Plot numbering (10-67) is unchanged from the prior verified digitization.
 * Plot "37" is printed twice in the source on two adjacent cells; both cells
 * are kept in the map (karthikeya-plot-037 and karthikeya-plot-037b), each
 * labeled 37, matching the source drawing.
 * ------------------------------------------------------------------------- */

export type PlotStatus = "available" | "booked" | "registered" | "sold";

export interface LayoutPlotEntry {
  id: string;
  plotNumber: string;
  polygon: Point[];
  area: number;
  areaSqYd: number | null;
  center: Point;
  dimensions?: { width?: string; depth?: string };
  status?: PlotStatus;
  needsReview?: boolean;
  reviewNote?: string;
}

export interface RoadEntry {
  id: string;
  type: string;
  label?: string;
  polygon: Point[];
  path?: Point[];
  precision?: string;
}

export interface RegionEntry {
  id: string;
  label: string;
  polygon: Point[];
  precision?: string;
  type?: string;
}

export interface UtilityMarkerEntry {
  id: string;
  label: string;
  position: Point;
  needsReview?: boolean;
  note?: string;
}

export interface BoundaryEntry {
  id: string;
  label: string;
  polygon: Point[];
  precision?: string;
}

export interface GisBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface LayoutSpec {
  key: string;
  name: string;
  plotNumberMapping: LayoutPlotEntry[];
  roads: RoadEntry[];
  existingRoads: RoadEntry[];
  openSpaces: RegionEntry[];
  utilities: UtilityMarkerEntry[];
  amenities: RegionEntry[];
  boundary: BoundaryEntry;
  // GIS: the venture's geographic placement (supplied by the site owner).
  // - gisCenter      : GPS coordinate that the layout's drawing centre maps to.
  // - gisRotationDeg : compass bearing (degrees clockwise from true north) that
  //                    the drawing's "up" (-y) edge points toward. Non-zero so
  //                    the drawn layout is rotated to match the real-world on-
  //                    ground orientation (e.g. 293.3 aligns the drawn NH-167AG
  //                    highway flank with the actual road).
  // - gisBounds      : north-up bounding box of the rotated venture footprint,
  //                    used for the map's initial view centre and the GIS chip.
  gisEnabled: boolean;
  gisCenter: { lat: number; lng: number } | null;
  gisRotationDeg: number;
  gisBounds: GisBounds | null;
}

export const LAYOUTS: LayoutSpec[] = [
  {
    key: "karthikeya",
    name: "Karthikeya Infra CES",
    plotNumberMapping: plotNumberMapping as unknown as LayoutPlotEntry[],
    roads: roadGeometry as unknown as RoadEntry[],
    existingRoads: existingRoadsJson as unknown as RoadEntry[],
    openSpaces: openSpacesJson as unknown as RegionEntry[],
    utilities: utilitiesJson as unknown as UtilityMarkerEntry[],
    amenities: amenitiesJson as unknown as RegionEntry[],
    boundary: layoutBoundaryJson as unknown as BoundaryEntry,
    gisEnabled: true,
    gisCenter: { lat: 16.34608, lng: 80.295745 },
    gisRotationDeg: 294.0,
    gisBounds: {
      minLat: 16.345194,
      maxLat: 16.346809,
      minLng: 80.294634,
      maxLng: 80.296516,
    },
  },
];

export const DEFAULT_LAYOUT = LAYOUTS[0];

export function getActiveLayout(): LayoutSpec {
  return DEFAULT_LAYOUT;
}

export function getPlotNumberMapping(): LayoutPlotEntry[] {
  return getActiveLayout().plotNumberMapping;
}

export function getRoads(): RoadEntry[] {
  return getActiveLayout().roads;
}

export function getExistingRoads(): RoadEntry[] {
  return getActiveLayout().existingRoads;
}

export function getOpenSpaces(): RegionEntry[] {
  return getActiveLayout().openSpaces;
}

export function getUtilities(): UtilityMarkerEntry[] {
  return getActiveLayout().utilities;
}

export function getAmenities(): RegionEntry[] {
  return getActiveLayout().amenities;
}

export function getBoundary(): BoundaryEntry {
  return getActiveLayout().boundary;
}

export function isGisEnabled(): boolean {
  return getActiveLayout().gisEnabled && getActiveLayout().gisBounds != null;
}

export function getGisBounds(): GisBounds | null {
  return getActiveLayout().gisBounds;
}

export function getGisCenter(): { lat: number; lng: number } | null {
  return getActiveLayout().gisCenter;
}
