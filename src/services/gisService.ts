/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as turf from '@turf/turf';
import { 
  AreaSelection, 
  CadastralParcel, 
  RoadRouteId, 
  RouteMetrics, 
  RouteOptimizationResult,
  ParcelImpactStatus 
} from '../types';

/**
 * Mock data generator for village cadastral boundaries.
 * Coordinates are localized in Chengalpattu district around Kariyampakkam (approx 80.115 to 80.140°E, 12.770 to 12.795°N).
 * Specifically arranged to match the cadastral survey plots in the reference satellite imagery.
 */
function generateVillageCadastre(seedVillage: string): CadastralParcel[] {
  const parcels: CadastralParcel[] = [];
  
  // Explicit parcels matching the reference map layout (P001 - P011)
  const coreParcels: CadastralParcel[] = [
    {
      // P001 - Bottom-left field plot (intersected by road entry)
      parcelId: 'P001',
      coordinates: [
        [80.1172, 12.7740],
        [80.1200, 12.7758],
        [80.1210, 12.7735],
        [80.1188, 12.7722],
        [80.1172, 12.7740],
      ],
    },
    {
      // P003 - Plot adjacent to P001 (intersected)
      parcelId: 'P003',
      coordinates: [
        [80.1198, 12.7760],
        [80.1222, 12.7778],
        [80.1232, 12.7755],
        [80.1208, 12.7738],
        [80.1198, 12.7760],
      ],
    },
    {
      // P002 - Center-left agricultural field (intersected)
      parcelId: 'P002',
      coordinates: [
        [80.1218, 12.7780],
        [80.1245, 12.7798],
        [80.1256, 12.7775],
        [80.1228, 12.7758],
        [80.1218, 12.7780],
      ],
    },
    {
      // P004 - Field plot crossing local road (intersected)
      parcelId: 'P004',
      coordinates: [
        [80.1242, 12.7802],
        [80.1275, 12.7825],
        [80.1286, 12.7805],
        [80.1255, 12.7782],
        [80.1242, 12.7802],
      ],
    },
    {
      // P005 - The central inspected parcel with 6 vertices (intersected & selected)
      parcelId: 'P005',
      coordinates: [
        [80.1270, 12.7825],
        [80.1302, 12.7845],
        [80.1315, 12.7832],
        [80.1310, 12.7808],
        [80.1288, 12.7800],
        [80.1272, 12.7812],
        [80.1270, 12.7825],
      ],
    },
    {
      // P007 - Upper-right corridor field (intersected)
      parcelId: 'P007',
      coordinates: [
        [80.1305, 12.7850],
        [80.1342, 12.7875],
        [80.1352, 12.7852],
        [80.1318, 12.7828],
        [80.1305, 12.7850],
      ],
    },
    {
      // P010 - Far upper-right boundary plot (intersected)
      parcelId: 'P010',
      coordinates: [
        [80.1342, 12.7878],
        [80.1382, 12.7905],
        [80.1392, 12.7882],
        [80.1355, 12.7858],
        [80.1342, 12.7878],
      ],
    },
    {
      // P006 - Top-left paddy field (NOT intersected)
      parcelId: 'P006',
      coordinates: [
        [80.1205, 12.7835],
        [80.1245, 12.7858],
        [80.1255, 12.7832],
        [80.1215, 12.7810],
        [80.1205, 12.7835],
      ],
    },
    {
      // P008 - Northern orchard plot (NOT intersected)
      parcelId: 'P008',
      coordinates: [
        [80.1255, 12.7875],
        [80.1295, 12.7898],
        [80.1305, 12.7872],
        [80.1265, 12.7850],
        [80.1255, 12.7875],
      ],
    },
    {
      // P009 - Western grove parcel (NOT intersected)
      parcelId: 'P009',
      coordinates: [
        [80.1160, 12.7785],
        [80.1195, 12.7808],
        [80.1202, 12.7782],
        [80.1168, 12.7760],
        [80.1160, 12.7785],
      ],
    },
    {
      // P011 - Far northeast field (NOT intersected)
      parcelId: 'P011',
      coordinates: [
        [80.1325, 12.7915],
        [80.1365, 12.7938],
        [80.1375, 12.7912],
        [80.1335, 12.7890],
        [80.1325, 12.7915],
      ],
    },
  ];

  parcels.push(...coreParcels);

  // Generate additional surrounding cadastral plots across the village boundary (P012 to P048)
  let counter = 12;
  const baseLng = 80.115;
  const baseLat = 12.770;
  const stepX = 0.0035;
  const stepY = 0.0032;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const id = `P${String(counter).padStart(3, '0')}`;
      counter++;

      const x0 = baseLng + c * stepX;
      const y0 = baseLat + r * stepY;

      // Ensure no collision with core parcels
      if (
        (c >= 1 && c <= 5 && r >= 1 && r <= 3)
      ) {
        continue;
      }

      parcels.push({
        parcelId: id,
        coordinates: [
          [Number((x0 + 0.0002).toFixed(5)), Number((y0 + 0.0001).toFixed(5))],
          [Number((x0 + stepX - 0.0002).toFixed(5)), Number((y0 + 0.0003).toFixed(5))],
          [Number((x0 + stepX + 0.0001).toFixed(5)), Number((y0 + stepY - 0.0002).toFixed(5))],
          [Number((x0 - 0.0001).toFixed(5)), Number((y0 + stepY).toFixed(5))],
          [Number((x0 + 0.0002).toFixed(5)), Number((y0 + 0.0001).toFixed(5))],
        ],
      });
    }
  }

  return parcels;
}

/**
 * 2. LOAD PARCELS AFTER AREA SELECTION
 * Simulates sending selected area to mock backend service.
 * Request payload: { state, district, taluk, village }
 * Response payload: ONLY parcelId and coordinates array.
 */
export async function fetchParcelsForArea(area: AreaSelection): Promise<CadastralParcel[]> {
  console.log('[GIS Backend Request] Querying cadastral parcels for area:', area);

  // Artificial network latency simulation (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const parcels = generateVillageCadastre(area.village);
  console.log(`[GIS Backend Response] Received ${parcels.length} parcel boundary geometries for ${area.village}.`);
  return parcels;
}

/**
 * Generates a smooth Catmull-Rom spline path through control points.
 * Produces a densified list of coordinates forming smooth horizontal transition curves.
 */
export function generateCurvedCoordinates(
  controlPoints: [number, number][],
  segmentsPerSpan: number = 16
): [number, number][] {
  if (!controlPoints || controlPoints.length < 3) return controlPoints || [];

  const result: [number, number][] = [];
  // Duplicate endpoints to ensure the curve passes through the first and last point
  const pts = [
    controlPoints[0],
    ...controlPoints,
    controlPoints[controlPoints.length - 1],
  ];

  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    for (let s = 0; s < segmentsPerSpan; s++) {
      const t = s / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;

      // Standard Catmull-Rom spline formula (0.5 tension)
      const lng =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);

      const lat =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

      result.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
    }
  }

  result.push(controlPoints[controlPoints.length - 1]);
  return result;
}

/**
 * 5. FRONTEND SPATIAL ANALYSIS
 * Turf.js spatial intersection between user-drawn road alignment (or its corridor buffer)
 * and all loaded parcel polygons.
 * Runs 100% on the frontend without sending geometry to backend.
 */
export function calculateIntersectedParcels(
  parcels: CadastralParcel[],
  roadCoordinates: [number, number][],
  bufferMeters: number = 45,
  isCurved: boolean = false
): string[] {
  if (!parcels || parcels.length === 0 || !roadCoordinates || roadCoordinates.length < 2) {
    return [];
  }

  const intersectedParcelIds: string[] = [];

  try {
    // If curved alignment is active and we have >= 3 vertices, evaluate against the smooth spline
    const effectiveCoords = isCurved && roadCoordinates.length >= 3
      ? generateCurvedCoordinates(roadCoordinates)
      : roadCoordinates;

    const roadLine = turf.lineString(effectiveCoords);
    // 45m corridor buffer around the road centerline
    const roadBuffer = turf.buffer(roadLine, bufferMeters / 1000, { units: 'kilometers' });

    for (const parcel of parcels) {
      if (!parcel.coordinates || parcel.coordinates.length < 3) continue;

      try {
        // Ensure polygon ring is closed
        const ring = [...parcel.coordinates];
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          ring.push([...ring[0]]);
        }

        const parcelPolygon = turf.polygon([ring]);

        // Spatial test: Does the road line or corridor buffer intersect the parcel polygon?
        const lineIntersects = turf.booleanIntersects(parcelPolygon, roadLine);
        const bufferIntersects = roadBuffer ? turf.booleanIntersects(parcelPolygon, roadBuffer) : false;

        if (lineIntersects || bufferIntersects) {
          intersectedParcelIds.push(parcel.parcelId);
        }
      } catch (err) {
        console.warn(`Turf intersection error for parcel ${parcel.parcelId}:`, err);
      }
    }
  } catch (err) {
    console.error('Failed to run spatial analysis:', err);
  }

  console.log(`[Frontend GIS Analysis] Completed. ${intersectedParcelIds.length} intersected parcels detected:`, intersectedParcelIds);
  return intersectedParcelIds;
}

/**
 * 10. BACKEND HANDOFF
 * Clean service function to get intersected parcel IDs and send them to backend.
 */
export function getIntersectedParcelIds(intersectedIds: string[]): string[] {
  return [...intersectedIds];
}

export async function sendIntersectedParcelIds(parcelIds: string[]): Promise<{
  success: boolean;
  parcelIds: string[];
  timestamp: string;
}> {
  const payload = {
    parcelIds: [...parcelIds],
  };

  // Required by prompt: Log payload to console
  console.log('[GIS Backend Handoff] Dispatching Intersected Parcel IDs to Acquisition Workflow (Next Phase):', payload);

  // Simulated round-trip
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    success: true,
    parcelIds,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Default sample highway alignment coordinates crossing diagonally through the Kariyampakkam cadastre.
 * Used for pre-loading or instant alignment demonstration matching Image 1.png.
 */
export const DEFAULT_HIGHWAY_ALIGNMENT: [number, number][] = [
  [80.1165, 12.7735],
  [80.1205, 12.7760],
  [80.1245, 12.7788],
  [80.1290, 12.7825],
  [80.1330, 12.7860],
  [80.1375, 12.7895],
];

/**
 * Default sample railway corridor alignment traversing east-west across northern cadastre plots.
 * High-speed double-line broad gauge alignment.
 */
export const DEFAULT_RAILWAY_ALIGNMENT: [number, number][] = [
  [80.1150, 12.7872],
  [80.1208, 12.7852],
  [80.1265, 12.7836],
  [80.1325, 12.7818],
  [80.1390, 12.7802],
];

export interface MultiCorridorAnalysisParams {
  parcels: CadastralParcel[];
  roadCoordinates?: [number, number][];
  roadBufferMeters?: number;
  isRoadCurved?: boolean;
  routeBCoordinates?: [number, number][];
  routeBBufferMeters?: number;
  isRouteBCurved?: boolean;
  railwayCoordinates?: [number, number][];
  railwayBufferMeters?: number;
  isRailwayCurved?: boolean;
}

export interface MultiCorridorAnalysisResult {
  allIntersectedIds: string[];
  roadIntersectedIds: string[];
  routeAIntersectedIds: string[];
  routeBIntersectedIds: string[];
  railwayIntersectedIds: string[];
}

export function calculateCombinedIntersections(
  params: MultiCorridorAnalysisParams
): MultiCorridorAnalysisResult {
  const {
    parcels,
    roadCoordinates = [],
    roadBufferMeters = 45,
    isRoadCurved = false,
    routeBCoordinates = [],
    routeBBufferMeters = 45,
    isRouteBCurved = false,
    railwayCoordinates = [],
    railwayBufferMeters = 30,
    isRailwayCurved = false,
  } = params;

  const roadIntersectedIds = roadCoordinates.length >= 2
    ? calculateIntersectedParcels(parcels, roadCoordinates, roadBufferMeters, isRoadCurved)
    : [];

  const routeBIntersectedIds = routeBCoordinates.length >= 2
    ? calculateIntersectedParcels(parcels, routeBCoordinates, routeBBufferMeters, isRouteBCurved)
    : [];

  const railwayIntersectedIds = railwayCoordinates.length >= 2
    ? calculateIntersectedParcels(parcels, railwayCoordinates, railwayBufferMeters, isRailwayCurved)
    : [];

  const allSet = new Set([...roadIntersectedIds, ...routeBIntersectedIds, ...railwayIntersectedIds]);

  return {
    allIntersectedIds: Array.from(allSet),
    roadIntersectedIds,
    routeAIntersectedIds: roadIntersectedIds,
    routeBIntersectedIds,
    railwayIntersectedIds,
  };
}

/**
 * Calculates line distance in kilometers and meters using Turf.js
 */
export function calculateRouteDistance(
  coordinates: [number, number][],
  isCurved: boolean = false
): { km: number; meters: number } {
  if (!coordinates || coordinates.length < 2) {
    return { km: 0, meters: 0 };
  }
  try {
    const effectiveCoords = isCurved && coordinates.length >= 3
      ? generateCurvedCoordinates(coordinates, 20)
      : coordinates;
    const line = turf.lineString(effectiveCoords);
    const km = turf.length(line, { units: 'kilometers' });
    return {
      km: Number(km.toFixed(2)),
      meters: Math.round(km * 1000),
    };
  } catch (err) {
    console.warn('Failed to calculate route length:', err);
    return { km: 0, meters: 0 };
  }
}

/**
 * Route A Default Alignment (Primary Highway Corridor)
 */
export const DEFAULT_ROUTE_A_ALIGNMENT = DEFAULT_HIGHWAY_ALIGNMENT;

/**
 * Route B Default Alignment (Southern Bypass Alternative Corridor)
 * Designed to bypass dense settlement clusters with a more direct sweep.
 */
export const DEFAULT_ROUTE_B_ALIGNMENT: [number, number][] = [
  [80.1160, 12.7718],
  [80.1215, 12.7732],
  [80.1275, 12.7758],
  [80.1335, 12.7808],
  [80.1382, 12.7865],
];

export interface EvaluateRouteOptimizationParams {
  parcels: CadastralParcel[];
  routeACoordinates: [number, number][];
  isRouteACurved: boolean;
  routeBCoordinates: [number, number][];
  isRouteBCurved: boolean;
  bufferMeters: number;
}

/**
 * Evaluates Route A vs Route B based on:
 * 1. Number of packages/parcels affected (lower impact = preferred)
 * 2. Distance in kilometers/meters (shorter length = preferred)
 * Produces optimal route decision with transparent multi-criteria explanation.
 */
export function evaluateRouteOptimization(
  params: EvaluateRouteOptimizationParams
): RouteOptimizationResult {
  const {
    parcels,
    routeACoordinates,
    isRouteACurved,
    routeBCoordinates,
    isRouteBCurved,
    bufferMeters,
  } = params;

  // 1. Calculate Route A metrics
  const distA = calculateRouteDistance(routeACoordinates, isRouteACurved);
  const intersectedA = routeACoordinates.length >= 2
    ? calculateIntersectedParcels(parcels, routeACoordinates, bufferMeters, isRouteACurved)
    : [];

  // 2. Calculate Route B metrics
  const distB = calculateRouteDistance(routeBCoordinates, isRouteBCurved);
  const intersectedB = routeBCoordinates.length >= 2
    ? calculateIntersectedParcels(parcels, routeBCoordinates, bufferMeters, isRouteBCurved)
    : [];

  // Default initial scores
  let scoreA = 0;
  let scoreB = 0;

  const validA = routeACoordinates.length >= 2;
  const validB = routeBCoordinates.length >= 2;

  let optimalRouteId: RoadRouteId | null = null;
  let winnerReason = '';

  if (validA && !validB) {
    optimalRouteId = 'routeA';
    winnerReason = 'Route A is the only complete route drawn (min 2 vertices required for Route B).';
  } else if (!validA && validB) {
    optimalRouteId = 'routeB';
    winnerReason = 'Route B is the only complete route drawn (min 2 vertices required for Route A).';
  } else if (validA && validB) {
    const pkgDiff = intersectedA.length - intersectedB.length; // positive means A has more affected packages
    const distDiffKm = Number((distA.km - distB.km).toFixed(2)); // positive means A is longer
    const distDiffM = distA.meters - distB.meters;

    // Normalization & Scoring
    // Normalized cost: 60% weight on parcel displacement (land acquisition resistance), 40% on distance
    const maxPkgs = Math.max(intersectedA.length, intersectedB.length, 1);
    const maxDist = Math.max(distA.km, distB.km, 0.1);

    scoreA = (intersectedA.length / maxPkgs) * 60 + (distA.km / maxDist) * 40;
    scoreB = (intersectedB.length / maxPkgs) * 60 + (distB.km / maxDist) * 40;

    if (pkgDiff === 0 && Math.abs(distDiffM) < 20) {
      optimalRouteId = distA.meters <= distB.meters ? 'routeA' : 'routeB';
      winnerReason = `Both routes have identical parcel impact (${intersectedA.length} packages affected) and comparable distances (~${distA.km} km).`;
    } else if (pkgDiff < 0 && distDiffM <= 0) {
      // Route A wins decisively on both
      optimalRouteId = 'routeA';
      winnerReason = `Route A is decisively optimal: affects ${Math.abs(pkgDiff)} fewer packages (${intersectedA.length} vs ${intersectedB.length}) and is ${Math.abs(distDiffM)}m shorter (${distA.km} km vs ${distB.km} km).`;
    } else if (pkgDiff > 0 && distDiffM >= 0) {
      // Route B wins decisively on both
      optimalRouteId = 'routeB';
      winnerReason = `Route B is decisively optimal: affects ${Math.abs(pkgDiff)} fewer packages (${intersectedB.length} vs ${intersectedA.length}) and is ${Math.abs(distDiffM)}m shorter (${distB.km} km vs ${distA.km} km).`;
    } else if (pkgDiff < 0 && distDiffM > 0) {
      // Route A has fewer parcels, but Route B is shorter
      if (scoreA < scoreB) {
        optimalRouteId = 'routeA';
        winnerReason = `Route A is optimal: minimizes land acquisition by saving ${Math.abs(pkgDiff)} packages (${intersectedA.length} vs ${intersectedB.length}) despite being ${Math.abs(distDiffM)}m longer.`;
      } else {
        optimalRouteId = 'routeB';
        winnerReason = `Route B is optimal: provides a significantly shorter alignment (${Math.abs(distDiffM)}m shorter) with acceptable parcel impact.`;
      }
    } else {
      // Route B has fewer parcels, but Route A is shorter
      if (scoreB < scoreA) {
        optimalRouteId = 'routeB';
        winnerReason = `Route B is optimal: minimizes land acquisition by saving ${Math.abs(pkgDiff)} packages (${intersectedB.length} vs ${intersectedA.length}) despite being ${Math.abs(distDiffM)}m longer.`;
      } else {
        optimalRouteId = 'routeA';
        winnerReason = `Route A is optimal: provides a significantly shorter alignment (${Math.abs(distDiffM)}m shorter) with acceptable parcel impact.`;
      }
    }
  } else {
    winnerReason = 'Draw at least 2 points along Route A and Route B to compute the optimal corridor.';
  }

  return {
    routeA: {
      id: 'routeA',
      name: 'Route A',
      coordinates: routeACoordinates,
      isCurved: isRouteACurved,
      distanceKm: distA.km,
      distanceMeters: distA.meters,
      packagesAffectedCount: intersectedA.length,
      intersectedParcelIds: intersectedA,
      score: Number(scoreA.toFixed(1)),
    },
    routeB: {
      id: 'routeB',
      name: 'Route B',
      coordinates: routeBCoordinates,
      isCurved: isRouteBCurved,
      distanceKm: distB.km,
      distanceMeters: distB.meters,
      packagesAffectedCount: intersectedB.length,
      intersectedParcelIds: intersectedB,
      score: Number(scoreB.toFixed(1)),
    },
    optimalRouteId,
    winnerReason,
    packagesDifference: intersectedA.length - intersectedB.length,
    distanceDifferenceKm: Number((distA.km - distB.km).toFixed(2)),
  };
}

export interface EvaluateParcelImpactParams {
  parcel: CadastralParcel;
  roadCoordinates?: [number, number][];
  roadBufferMeters?: number;
  isRoadCurved?: boolean;
  routeBCoordinates?: [number, number][];
  routeBBufferMeters?: number;
  isRouteBCurved?: boolean;
  railwayCoordinates?: [number, number][];
  railwayBufferMeters?: number;
  isRailwayCurved?: boolean;
  roadIntersectedIds?: string[];
  routeBIntersectedIds?: string[];
  railwayIntersectedIds?: string[];
  analysisPerformed?: boolean;
}

/**
 * Evaluates whether a specific cadastral parcel is affected by active highway/railway corridors.
 * Runs instantly on single-polygon geometry using Turf.js or leverages cached analysis results.
 */
export function evaluateParcelImpact(params: EvaluateParcelImpactParams): ParcelImpactStatus {
  const {
    parcel,
    roadCoordinates = [],
    roadBufferMeters = 45,
    isRoadCurved = false,
    routeBCoordinates = [],
    routeBBufferMeters = 45,
    isRouteBCurved = false,
    railwayCoordinates = [],
    railwayBufferMeters = 30,
    isRailwayCurved = false,
    roadIntersectedIds,
    routeBIntersectedIds,
    railwayIntersectedIds,
    analysisPerformed = false,
  } = params;

  const hasRouteA = roadCoordinates.length >= 2;
  const hasRouteB = routeBCoordinates.length >= 2;
  const hasRailway = railwayCoordinates.length >= 2;
  const hasCorridors = hasRouteA || hasRouteB || hasRailway;

  if (!hasCorridors) {
    return {
      parcelId: parcel.parcelId,
      hasCorridors: false,
      isAffected: false,
      hitsRouteA: false,
      hitsRouteB: false,
      hitsRailway: false,
      affectedCorridors: [],
      statusText: 'NO CORRIDORS ACTIVE',
      headline: 'No Active Corridors Defined',
      detailMessage: 'No highway or railway corridor alignments are currently drawn. Draw a corridor or load sample alignments to assess impact.',
      recommendedAction: 'Draw Route A, Route B, or Railway corridor to check acquisition impact.',
    };
  }

  let hitsRouteA = false;
  let hitsRouteB = false;
  let hitsRailway = false;

  if (analysisPerformed && roadIntersectedIds && routeBIntersectedIds && railwayIntersectedIds) {
    hitsRouteA = roadIntersectedIds.includes(parcel.parcelId);
    hitsRouteB = routeBIntersectedIds.includes(parcel.parcelId);
    hitsRailway = railwayIntersectedIds.includes(parcel.parcelId);
  } else {
    // Instant geometry intersection evaluation for the single parcel
    try {
      if (parcel.coordinates && parcel.coordinates.length >= 3) {
        const ring = [...parcel.coordinates];
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          ring.push([...ring[0]]);
        }
        const parcelPoly = turf.polygon([ring]);

        if (hasRouteA) {
          const effA = isRoadCurved && roadCoordinates.length >= 3
            ? generateCurvedCoordinates(roadCoordinates)
            : roadCoordinates;
          const lineA = turf.lineString(effA);
          const bufA = turf.buffer(lineA, roadBufferMeters / 1000, { units: 'kilometers' });
          hitsRouteA = turf.booleanIntersects(parcelPoly, lineA) || (bufA ? turf.booleanIntersects(parcelPoly, bufA) : false);
        }

        if (hasRouteB) {
          const effB = isRouteBCurved && routeBCoordinates.length >= 3
            ? generateCurvedCoordinates(routeBCoordinates)
            : routeBCoordinates;
          const lineB = turf.lineString(effB);
          const bufB = turf.buffer(lineB, routeBBufferMeters / 1000, { units: 'kilometers' });
          hitsRouteB = turf.booleanIntersects(parcelPoly, lineB) || (bufB ? turf.booleanIntersects(parcelPoly, bufB) : false);
        }

        if (hasRailway) {
          const effRw = isRailwayCurved && railwayCoordinates.length >= 3
            ? generateCurvedCoordinates(railwayCoordinates)
            : railwayCoordinates;
          const lineRw = turf.lineString(effRw);
          const bufRw = turf.buffer(lineRw, railwayBufferMeters / 1000, { units: 'kilometers' });
          hitsRailway = turf.booleanIntersects(parcelPoly, lineRw) || (bufRw ? turf.booleanIntersects(parcelPoly, bufRw) : false);
        }
      }
    } catch (err) {
      console.warn(`Error evaluating impact for parcel ${parcel.parcelId}:`, err);
    }
  }

  const isAffected = hitsRouteA || hitsRouteB || hitsRailway;
  const affectedCorridors: string[] = [];
  if (hitsRouteA) affectedCorridors.push('Route A (Highway)');
  if (hitsRouteB) affectedCorridors.push('Route B (Highway)');
  if (hitsRailway) affectedCorridors.push('Railway Corridor');

  if (isAffected) {
    const corridorList = affectedCorridors.join(' & ');
    return {
      parcelId: parcel.parcelId,
      hasCorridors: true,
      isAffected: true,
      hitsRouteA,
      hitsRouteB,
      hitsRailway,
      affectedCorridors,
      statusText: 'AFFECTED',
      headline: `AFFECTED BY ${corridorList.toUpperCase()}`,
      detailMessage: `This parcel falls within the designated Right-of-Way (ROW) corridor buffer of ${corridorList}. Land acquisition and compensation verification required.`,
      recommendedAction: 'Schedule parcel boundary cadastral survey and compute land parcel compensation entitlement.',
    };
  }

  return {
    parcelId: parcel.parcelId,
    hasCorridors: true,
    isAffected: false,
    hitsRouteA: false,
    hitsRouteB: false,
    hitsRailway: false,
    affectedCorridors: [],
    statusText: 'NOT AFFECTED',
    headline: 'NOT AFFECTED (CLEAR)',
    detailMessage: 'This parcel lies safely outside all active corridor Right-of-Way envelopes. No land acquisition or compensation required.',
    recommendedAction: 'No action required — parcel remains unencumbered by planned alignment.',
  };
}
