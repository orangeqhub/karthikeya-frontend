import { Point } from "./types/dxf";
import {
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
  return {
    minLat: gis.minLat,
    maxLat: gis.maxLat,
    minLng: gis.minLng,
    maxLng: gis.maxLng,
    center: { lat: (gis.minLat + gis.maxLat) / 2, lng: (gis.minLng + gis.maxLng) / 2 },
  };
}

export function localToLatLng(p: Point): GeoLine {
  const gis = getGisBounds();
  if (!gis) return zeroLine;
  const box = anchorBox();
  const fx = (p.x - box.xMin) / box.width;
  const fy = (p.y - box.yMin) / box.height;
  return {
    lng: gis.minLng + fx * (gis.maxLng - gis.minLng),
    lat: gis.maxLat - fy * (gis.maxLat - gis.minLat),
  };
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