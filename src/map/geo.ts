import { Point } from "./types/dxf";
import {
  getActiveLayout,
  getGisBounds,
  getBoundary,
  getPlotNumberMapping,
  getRoads,
  getOpenSpaces,
  getAmenities,
  type RoadEntry,
  type RegionEntry,
  type BoundaryEntry,
  type LayoutPlotEntry,
} from "./layouts";

export interface GeoLine {
  lat: number;
  lng: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  center: GeoLine;
}

const zeroLine: GeoLine = { lat: 0, lng: 0 };

const METRES_PER_LAT_DEG = 111320; // average metres per degree of latitude

export function anchorBox() {
  const pts = getBoundary().polygon;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of pts) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  return { xMin, xMax, yMin, yMax, width: xMax - xMin, height: yMax - yMin };
}

export function getGeoBounds(): GeoBounds | null {
  const gis = getGisBounds();
  if (!gis) return null;
  return ventureGeoBounds();
}

/**
 * Maps a local (feet, x-right / y-down) drawing point to lat/lng using a
 * uniform similarity transform: translate to the drawing centre, rotate by the
 * layout's real-world bearing (gisRotationDeg), scale feet -> metres, then
 * project metres -> degrees anchored at the venture's GPS centre (gisCenter).
 * The rotation keeps the venture's true footprint and orientation on the map
 * (the drawn NH-167AG highway flank aligns with the actual road).
 */
export function localToLatLng(p: Point): GeoLine {
  const layout = getActiveLayout();
  if (!layout.gisEnabled || !layout.gisCenter) return zeroLine;
  const box = anchorBox();
  const cx = (box.xMin + box.xMax) / 2;
  const cy = (box.yMin + box.yMax) / 2;
  const dx = p.x - cx; // feet, +x = drawing right
  const dy = p.y - cy; // feet, +y = drawing down (screen-like)
  const theta = -layout.gisRotationDeg * (Math.PI / 180);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const e = dx * 0.3048; // unrotated easting, metres
  const n = -dy * 0.3048; // unrotated northing, metres
  const e2 = e * cosT - n * sinT;
  const n2 = e * sinT + n * cosT;
  const lat = layout.gisCenter.lat + n2 / METRES_PER_LAT_DEG;
  const metresPerLngDeg = METRES_PER_LAT_DEG * Math.cos(lat * (Math.PI / 180));
  return { lat, lng: layout.gisCenter.lng + e2 / metresPerLngDeg };
}

function polygonToGeo(polygon: Point[]): Array<[number, number]> {
  return polygon.map((p) => {
    const g = localToLatLng(p);
    return [g.lat, g.lng] as [number, number];
  });
}

export function plotToGeo(p: LayoutPlotEntry): Array<[number, number]> {
  return polygonToGeo(p.polygon);
}

export function roadToGeo(r: RoadEntry): Array<[number, number]> {
  return polygonToGeo(r.polygon);
}

export function pathToGeo(path: Point[]): Array<[number, number]> {
  return path.map((p) => {
    const g = localToLatLng(p);
    return [g.lat, g.lng] as [number, number];
  });
}

export function regionToGeo(r: RegionEntry): Array<[number, number]> {
  return polygonToGeo(r.polygon);
}

export function boundaryToGeo(b: BoundaryEntry): Array<[number, number]> {
  return polygonToGeo(b.polygon);
}

export function centerOfPoints(pts: Array<[number, number]>): [number, number] {
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

// Geographic bounds of the ACTUAL venture geometry (boundary + plots + roads
// + open spaces + amenities). The external main road / highway is deliberately
// excluded so it does not dominate the initial view: it is a neighbouring
// feature, not the venture itself. The full supplied coordinate rectangle is
// NOT used as the zoom target.
export function ventureGeoBounds(): GeoBounds | null {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  const acc = (pts: Array<[number, number]>) => {
    for (const [la, ln] of pts) {
      if (ln < minLng) minLng = ln;
      if (ln > maxLng) maxLng = ln;
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
    }
  };
  acc(boundaryToGeo(getBoundary()));
  for (const p of getPlotNumberMapping()) acc(plotToGeo(p));
  for (const r of getRoads()) acc(roadToGeo(r));
  for (const o of getOpenSpaces()) acc(regionToGeo(o));
  for (const a of getAmenities()) acc(regionToGeo(a));
  if (minLat === Infinity) return null;
  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
  };
}