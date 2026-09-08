/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IntersectionStatus = 'NOT INTERSECTED' | 'INTERSECTED' | 'SELECTED';

export type AlignmentType = 'road' | 'railway';

export type RoadRouteId = 'routeA' | 'routeB';

export type ActiveCorridorType = 'routeA' | 'routeB' | 'railway';

export interface RouteMetrics {
  id: RoadRouteId;
  name: string; // 'Route A' | 'Route B'
  coordinates: [number, number][];
  isCurved: boolean;
  distanceKm: number;
  distanceMeters: number;
  packagesAffectedCount: number; // packages/parcels affected
  intersectedParcelIds: string[];
  score: number; // composite optimization score (lower is better)
}

export interface RouteOptimizationResult {
  routeA: RouteMetrics;
  routeB: RouteMetrics;
  optimalRouteId: RoadRouteId | null; // null if neither or insufficient points
  winnerReason: string;
  packagesDifference: number; // Route A packages - Route B packages
  distanceDifferenceKm: number; // Route A distance - Route B distance
}

export interface ParcelCoordinate {
  lng: number;
  lat: number;
}

export type GeoJSONPolygonCoordinates = [number, number][][];

export interface CadastralParcel {
  parcelId: string;
  coordinates: [number, number][]; // outer ring: [[lng, lat], ...]
}

export interface AreaSelection {
  state: string;
  district: string;
  taluk: string;
  village: string;
}

export interface AlignmentVertex {
  id: string;
  lng: number;
  lat: number;
  chainageKm?: number;
}

export interface GISAnalysisResult {
  totalParcels: number;
  intersectedCount: number;
  intersectionPercentage: number;
  intersectedParcelIds: string[];
}

export interface ParcelImpactStatus {
  parcelId: string;
  hasCorridors: boolean;
  isAffected: boolean;
  hitsRouteA: boolean;
  hitsRouteB: boolean;
  hitsRailway: boolean;
  affectedCorridors: string[];
  statusText: 'AFFECTED' | 'NOT AFFECTED' | 'NO CORRIDORS ACTIVE';
  headline: string;
  detailMessage: string;
  recommendedAction: string;
}

export interface UserLiveLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}
