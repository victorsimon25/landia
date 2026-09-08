/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Layers, 
  Ruler, 
  Maximize2, 
  Pencil,
  Undo2,
  Trash2,
  Check,
  Zap,
  EyeOff,
  Navigation,
  Share2,
  Map as MapIcon,
  Spline,
  Move,
  Train,
  Route,
  Trophy,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Globe,
  LocateFixed,
  ExternalLink,
  Compass
} from 'lucide-react';
import { CadastralParcel, ActiveCorridorType, RoadRouteId, ParcelImpactStatus, UserLiveLocation } from '../types';
import { 
  DEFAULT_HIGHWAY_ALIGNMENT, 
  DEFAULT_ROUTE_A_ALIGNMENT,
  DEFAULT_ROUTE_B_ALIGNMENT,
  DEFAULT_RAILWAY_ALIGNMENT,
  generateCurvedCoordinates,
  evaluateParcelImpact
} from '../services/gisService';
import { drawRailwayTrack, drawRailwayHandles } from '../utils/railwayRenderer';
import { renderSlippyTiles, tileManager, MapTileProvider } from '../services/tileService';
import { getCurrentUserLocation, reverseGeocodeCoordinates } from '../services/geolocationService';
import { RealLifeMapModal } from './RealLifeMapModal';

interface MapViewportProps {
  parcels: CadastralParcel[];
  parcelsLoaded: boolean;

  // Live User Location
  userLocation?: UserLiveLocation | null;
  onUpdateUserLocation?: (location: UserLiveLocation) => void;
  onLoadParcelsAtLocation?: (lat: number, lng: number) => void;

  // Route A (Road 1)
  roadCoordinates: [number, number][];
  onUpdateRoadCoordinates: (coords: [number, number][], isFinalRelease?: boolean) => void;
  isCurved?: boolean;
  onToggleCurved?: (curved: boolean) => void;
  showRoad?: boolean;

  // Route B (Road 2 Alternative)
  routeBCoordinates?: [number, number][];
  onUpdateRouteBCoordinates?: (coords: [number, number][], isFinalRelease?: boolean) => void;
  isRouteBCurved?: boolean;
  onToggleRouteBCurved?: (curved: boolean) => void;
  showRouteB?: boolean;

  // Selected Optimal Route
  optimalRouteId?: RoadRouteId | null;

  // Active Corridor Selection
  activeCorridorType?: ActiveCorridorType;
  onChangeActiveCorridorType?: (type: ActiveCorridorType) => void;

  intersectedParcelIds: string[];
  selectedParcelId: string | null;
  onSelectParcel: (parcel: CadastralParcel | null) => void;
  onRunAnalysis: () => void;
  analysisPerformed: boolean;
  bufferMeters: number;

  // Railway Alignment Support
  railwayCoordinates?: [number, number][];
  onUpdateRailwayCoordinates?: (coords: [number, number][], isFinalRelease?: boolean) => void;
  isRailwayCurved?: boolean;
  onToggleRailwayCurved?: (curved: boolean) => void;
  railwayBufferMeters?: number;
  activeAlignmentType?: 'road' | 'railway';
  onChangeActiveAlignmentType?: (type: 'road' | 'railway') => void;
  roadIntersectedIds?: string[];
  routeBIntersectedIds?: string[];
  railwayIntersectedIds?: string[];
  showRailway?: boolean;
}

export const MapViewport: React.FC<MapViewportProps> = ({
  parcels,
  parcelsLoaded,
  userLocation: propUserLocation,
  onUpdateUserLocation,
  onLoadParcelsAtLocation,
  roadCoordinates,
  onUpdateRoadCoordinates,
  intersectedParcelIds,
  selectedParcelId,
  onSelectParcel,
  onRunAnalysis,
  analysisPerformed,
  bufferMeters,
  isCurved = false,
  onToggleCurved,

  routeBCoordinates = [],
  onUpdateRouteBCoordinates,
  isRouteBCurved = false,
  onToggleRouteBCurved,
  showRouteB = true,

  optimalRouteId = null,

  activeCorridorType,
  onChangeActiveCorridorType,

  railwayCoordinates = [],
  onUpdateRailwayCoordinates,
  isRailwayCurved = false,
  onToggleRailwayCurved,
  railwayBufferMeters = 30,
  activeAlignmentType = 'road',
  onChangeActiveAlignmentType,
  roadIntersectedIds = [],
  routeBIntersectedIds = [],
  railwayIntersectedIds = [],
  showRoad = true,
  showRailway = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live User Location states
  const [localUserLocation, setLocalUserLocation] = useState<UserLiveLocation | null>(null);
  const activeUserLoc = propUserLocation || localUserLocation;
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isRealMapModalOpen, setIsRealMapModalOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Selected Parcel Impact Status for on-map HUD & rendering
  const selectedParcelObj = useMemo(() => {
    if (!selectedParcelId) return null;
    return parcels.find((p) => p.parcelId === selectedParcelId) || null;
  }, [selectedParcelId, parcels]);

  const selectedParcelImpact = useMemo(() => {
    if (!selectedParcelObj) return null;
    return evaluateParcelImpact({
      parcel: selectedParcelObj,
      roadCoordinates,
      roadBufferMeters: bufferMeters,
      isRoadCurved: isCurved,
      routeBCoordinates,
      routeBBufferMeters: bufferMeters,
      isRouteBCurved,
      railwayCoordinates,
      railwayBufferMeters,
      isRailwayCurved,
      roadIntersectedIds,
      routeBIntersectedIds,
      railwayIntersectedIds,
      analysisPerformed,
    });
  }, [
    selectedParcelObj,
    roadCoordinates,
    bufferMeters,
    isCurved,
    routeBCoordinates,
    isRouteBCurved,
    railwayCoordinates,
    railwayBufferMeters,
    isRailwayCurved,
    roadIntersectedIds,
    routeBIntersectedIds,
    railwayIntersectedIds,
    analysisPerformed,
  ]);

  // Derive current active corridor type ('routeA' | 'routeB' | 'railway')
  const currentActiveType: ActiveCorridorType = activeCorridorType || 
    (activeAlignmentType === 'railway' ? 'railway' : 'routeA');

  const setCorridorType = (type: ActiveCorridorType) => {
    if (onChangeActiveCorridorType) {
      onChangeActiveCorridorType(type);
    } else if (onChangeActiveAlignmentType) {
      onChangeActiveAlignmentType(type === 'railway' ? 'railway' : 'road');
    }
  };

  // Drawing & Editing mode states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'streets' | 'hybrid'>('osm');

  // Interactive vertex dragging & midpoint bending targets (supports routeA, routeB, and railway)
  const [draggedTarget, setDraggedTarget] = useState<{ type: ActiveCorridorType; index: number } | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<{ type: ActiveCorridorType; index: number } | null>(null);
  const [hoveredMidpointTarget, setHoveredMidpointTarget] = useState<{ type: ActiveCorridorType; index: number } | null>(null);

  // Viewport transformation: center lng/lat and zoom level
  const [center, setCenter] = useState<[number, number]>([80.1275, 12.7820]);
  const [zoom, setZoom] = useState(16.4); // scale matching reference image
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Measure tool state
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Handle GPS Locate Me
  const handleLocateUser = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const loc = await getCurrentUserLocation();
      setLocalUserLocation(loc);
      onUpdateUserLocation?.(loc);
      setCenter([loc.longitude, loc.latitude]);
      setZoom(16.5);

      // Asynchronously fetch human-readable address & neighborhood
      reverseGeocodeCoordinates(loc.latitude, loc.longitude).then((geo) => {
        const enriched: UserLiveLocation = {
          ...loc,
          address: geo.displayName,
          city: geo.city,
          state: geo.state,
          country: geo.country,
        };
        setLocalUserLocation(enriched);
        onUpdateUserLocation?.(enriched);
      });
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationError(err.message || 'Could not acquire GPS location.');
      setTimeout(() => setLocationError(null), 6000);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleFlyToLocation = (lat: number, lng: number) => {
    setCenter([lng, lat]);
    setZoom(16.5);
  };

  // Convert geo coordinates (lng, lat) to screen pixels (x, y)
  const project = useCallback(
    (lng: number, lat: number, width: number, height: number): [number, number] => {
      const latRad = (lat * Math.PI) / 180;
      const centerLatRad = (center[1] * Math.PI) / 180;
      const scale = Math.pow(2, zoom) * 256;

      const x = width / 2 + ((lng - center[0]) * (Math.PI / 180) * scale) / (2 * Math.PI);
      const y =
        height / 2 -
        ((Math.log(Math.tan(Math.PI / 4 + latRad / 2)) -
          Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2))) *
          scale) /
          (2 * Math.PI);

      return [x, y];
    },
    [center, zoom]
  );

  // Convert screen pixels (x, y) back to geo coordinates (lng, lat)
  const unproject = useCallback(
    (x: number, y: number, width: number, height: number): [number, number] => {
      const centerLatRad = (center[1] * Math.PI) / 180;
      const scale = Math.pow(2, zoom) * 256;

      const lng = center[0] + ((x - width / 2) * (2 * Math.PI)) / ((Math.PI / 180) * scale);
      const mercatorY = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2)) - ((y - height / 2) * (2 * Math.PI)) / scale;
      const latRad = 2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2;
      const lat = (latRad * 180) / Math.PI;

      return [lng, lat];
    },
    [center, zoom]
  );

  // Point in Polygon hit testing
  const isPointInPolygon = (x: number, y: number, polygon: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Main Canvas Rendering Loop
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. BASE MAP LAYER (Real-world Slippy Map Tiles: OpenStreetMap, Satellite, Streets, Hybrid)
    const activeProvider: MapTileProvider = 
      mapType === 'osm' ? 'osm-standard' :
      mapType === 'streets' ? 'carto-voyager' : 
      mapType === 'hybrid' ? 'hybrid' : 'esri-satellite';

    renderSlippyTiles({
      ctx,
      width,
      height,
      center,
      zoom,
      provider: activeProvider,
      project,
    });

    // 2. CADASTRAL PARCELS LAYER (Only visible when loaded)
    if (parcelsLoaded && parcels.length > 0) {
      parcels.forEach((parcel) => {
        if (!parcel.coordinates || parcel.coordinates.length < 3) return;

        const screenPts = parcel.coordinates.map((c) => project(c[0], c[1], width, height));

        const isIntersected = analysisPerformed && intersectedParcelIds.includes(parcel.parcelId);
        const isSelected = selectedParcelId === parcel.parcelId;

        // Draw Parcel Polygon
        ctx.beginPath();
        ctx.moveTo(screenPts[0][0], screenPts[0][1]);
        for (let i = 1; i < screenPts.length; i++) {
          ctx.lineTo(screenPts[i][0], screenPts[i][1]);
        }
        ctx.closePath();

        // Styling based on state
        if (isSelected) {
          const impact = selectedParcelImpact;
          const isAffected = impact ? impact.isAffected : isIntersected;
          const hasCorridors = impact ? impact.hasCorridors : true;

          if (isAffected) {
            // High-visibility rose/red for affected parcel
            ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
            ctx.fill();
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Vertex handles on corners in red
            screenPts.forEach(([px, py]) => {
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#E11D48';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(px, py, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          } else if (hasCorridors) {
            // High-visibility emerald green for unencumbered/clear parcel
            ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
            ctx.fill();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Vertex handles on corners in emerald
            screenPts.forEach(([px, py]) => {
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(px, py, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          } else {
            ctx.fillStyle = 'rgba(2, 132, 199, 0.32)';
            ctx.fill();
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Vertex handles on corners
            screenPts.forEach(([px, py]) => {
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#0284C7';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          }
        } else if (isIntersected) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
          ctx.fill();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Parcel Label (Centroid)
        let cx = 0;
        let cy = 0;
        screenPts.forEach(([px, py]) => {
          cx += px;
          cy += py;
        });
        cx /= screenPts.length;
        cy /= screenPts.length;

        ctx.save();
        ctx.font = '600 11px "IBM Plex Sans", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isSelected) {
          const impact = selectedParcelImpact;
          const isAffected = impact ? impact.isAffected : isIntersected;
          const hasCorridors = impact ? impact.hasCorridors : true;

          if (isAffected) {
            const corridorShort = impact?.affectedCorridors?.length
              ? impact.affectedCorridors.map((c: string) => c.replace(' (Highway)', '').replace(' Corridor', '')).join('+')
              : 'ROW';
            const labelText = `⚠️ ${parcel.parcelId} • AFFECTED (${corridorShort})`;
            ctx.font = 'bold 11px "IBM Plex Sans", monospace';
            const textWidth = ctx.measureText(labelText).width;
            const badgeW = textWidth + 16;
            const badgeH = 22;

            ctx.fillStyle = '#4c0519';
            ctx.fillRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH);
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH);
            ctx.fillStyle = '#FECDD3';
            ctx.fillText(labelText, cx, cy);
          } else if (hasCorridors) {
            const labelText = `✓ ${parcel.parcelId} • NOT AFFECTED (CLEAR)`;
            ctx.font = 'bold 11px "IBM Plex Sans", monospace';
            const textWidth = ctx.measureText(labelText).width;
            const badgeW = textWidth + 16;
            const badgeH = 22;

            ctx.fillStyle = '#022c22';
            ctx.fillRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH);
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH);
            ctx.fillStyle = '#A7F3D0';
            ctx.fillText(labelText, cx, cy);
          } else {
            ctx.fillStyle = '#0284C7';
            ctx.fillRect(cx - 20, cy - 9, 40, 18);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`• ${parcel.parcelId}`, cx, cy);
          }
        } else if (isIntersected) {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(cx - 16, cy - 8, 32, 16);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 16, cy - 8, 32, 16);
          ctx.fillStyle = '#F59E0B';
          ctx.fillText(parcel.parcelId, cx, cy);
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(cx - 15, cy - 7, 30, 14);
          ctx.fillStyle = '#F1F5F9';
          ctx.fillText(parcel.parcelId, cx, cy);
        }
        ctx.restore();
      });
    }

    // Helper: Draw Road Corridor (used for Route A and Route B)
    const drawRoadAlignment = (
      routeId: 'routeA' | 'routeB',
      coords: [number, number][],
      curved: boolean,
      isOptimal: boolean
    ) => {
      if (!parcelsLoaded || coords.length === 0) return;

      const isA = routeId === 'routeA';
      const primaryColor = isA ? '#0284C7' : '#059669';
      const innerStripeColor = isA ? '#FFFFFF' : '#FEF08A';
      const bufferFill = isA ? 'rgba(56, 189, 248, 0.20)' : 'rgba(16, 185, 129, 0.20)';
      const bufferStroke = isA ? 'rgba(56, 189, 248, 0.60)' : 'rgba(16, 185, 129, 0.60)';

      const displayCoords = curved && coords.length >= 3
        ? generateCurvedCoordinates(coords, 20)
        : coords;

      const roadScreenPts = displayCoords.map((c) => project(c[0], c[1], width, height));
      const controlScreenPts = coords.map((c) => project(c[0], c[1], width, height));

      // 1. Buffer Envelope (45m ROW)
      if (roadScreenPts.length >= 2) {
        ctx.save();
        const bufferPixelRadius = Math.max(18, (bufferMeters / 2.8) * (zoom / 15));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.strokeStyle = bufferFill;
        ctx.lineWidth = bufferPixelRadius * 2;
        ctx.beginPath();
        ctx.moveTo(roadScreenPts[0][0], roadScreenPts[0][1]);
        for (let i = 1; i < roadScreenPts.length; i++) {
          ctx.lineTo(roadScreenPts[i][0], roadScreenPts[i][1]);
        }
        ctx.stroke();

        ctx.strokeStyle = bufferStroke;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Optimal Route Glowing Halo
      if (isOptimal && roadScreenPts.length >= 2) {
        ctx.save();
        ctx.strokeStyle = isA ? 'rgba(56, 189, 248, 0.55)' : 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 14;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(roadScreenPts[0][0], roadScreenPts[0][1]);
        for (let i = 1; i < roadScreenPts.length; i++) {
          ctx.lineTo(roadScreenPts[i][0], roadScreenPts[i][1]);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. Centerline Road
      if (roadScreenPts.length >= 2) {
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(roadScreenPts[0][0], roadScreenPts[0][1]);
        for (let i = 1; i < roadScreenPts.length; i++) {
          ctx.lineTo(roadScreenPts[i][0], roadScreenPts[i][1]);
        }
        ctx.stroke();

        // Inner stripe
        ctx.strokeStyle = innerStripeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Optimal Route Badge
      if (isOptimal && roadScreenPts.length >= 2) {
        const midIdx = Math.floor(roadScreenPts.length / 2);
        const [mx, my] = roadScreenPts[midIdx];
        ctx.save();
        ctx.font = 'bold 10px "IBM Plex Sans", monospace';
        const badgeText = `${isA ? 'ROUTE A' : 'ROUTE B'} • OPTIMAL ALIGNMENT 🏆`;
        const tw = ctx.measureText(badgeText).width;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(mx - tw / 2 - 8, my - 26, tw + 16, 20);
        ctx.strokeStyle = isA ? '#38BDF8' : '#10B981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mx - tw / 2 - 8, my - 26, tw + 16, 20);

        ctx.fillStyle = isA ? '#7DD3FC' : '#6EE7B7';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, mx, my - 16);
        ctx.restore();
      }

      // 5. Midpoint bend handles (when active and not drawing)
      if (!isDrawingMode && currentActiveType === routeId && controlScreenPts.length >= 2) {
        for (let i = 0; i < controlScreenPts.length - 1; i++) {
          const [p1x, p1y] = controlScreenPts[i];
          const [p2x, p2y] = controlScreenPts[i + 1];
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;
          const isMidHovered = hoveredMidpointTarget?.type === routeId && hoveredMidpointTarget.index === i;

          ctx.save();
          ctx.fillStyle = isMidHovered ? (isA ? '#38BDF8' : '#34D399') : (isA ? 'rgba(56, 189, 248, 0.6)' : 'rgba(52, 211, 153, 0.6)');
          ctx.strokeStyle = '#0B192C';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mx, my, isMidHovered ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (isMidHovered) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', mx, my);
          }
          ctx.restore();
        }
      }

      // 6. Chainage Station Markers & Draggable Control Vertex Handles
      controlScreenPts.forEach(([px, py], index) => {
        const isHovered = hoveredTarget?.type === routeId && hoveredTarget.index === index;
        const isDragged = draggedTarget?.type === routeId && draggedTarget.index === index;

        ctx.save();

        if (isHovered || isDragged) {
          ctx.fillStyle = isA ? 'rgba(56, 189, 248, 0.35)' : 'rgba(52, 211, 153, 0.35)';
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = isDragged ? (isA ? '#38BDF8' : '#34D399') : '#FFFFFF';
        ctx.strokeStyle = isDragged ? (isA ? '#0369A1' : '#047857') : primaryColor;
        ctx.lineWidth = isDragged ? 3 : 2.5;
        ctx.beginPath();
        ctx.arc(px, py, isDragged ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chainage Station Label
        if (index > 0 && index < controlScreenPts.length - 1) {
          const chainageKm = (24 + index * 0.5).toFixed(3).replace('.', '+');
          const label = `${isA ? 'A' : 'B'}-Ch ${chainageKm}`;

          ctx.font = '600 10px "IBM Plex Sans", monospace';
          const textWidth = ctx.measureText(label).width;

          ctx.fillStyle = '#0B192C';
          ctx.fillRect(px + 8, py - 16, textWidth + 8, 16);
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 8, py - 16, textWidth + 8, 16);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(label, px + 12, py - 4);
        }
        ctx.restore();
      });
    };

    // 3. RENDER ROUTE A
    if (showRoad) {
      drawRoadAlignment('routeA', roadCoordinates, isCurved, optimalRouteId === 'routeA');
    }

    // 4. RENDER ROUTE B
    if (showRouteB) {
      drawRoadAlignment('routeB', routeBCoordinates, isRouteBCurved, optimalRouteId === 'routeB');
    }

    // 5. PROPOSED RAILWAY TRACK CORRIDOR (Authentic 2-Line Track with Sleepers)
    if (parcelsLoaded && showRailway && railwayCoordinates.length > 0) {
      const displayRailwayCoords = isRailwayCurved && railwayCoordinates.length >= 3
        ? generateCurvedCoordinates(railwayCoordinates, 20)
        : railwayCoordinates;

      const railwayScreenPts = displayRailwayCoords.map((c) => project(c[0], c[1], width, height));
      const controlRailwayScreenPts = railwayCoordinates.map((c) => project(c[0], c[1], width, height));

      const railwayBufferPixels = Math.max(16, (railwayBufferMeters / 2.8) * (zoom / 15));

      // Draw distinct 2-line railway track with perpendicular sleepers & buffer envelope
      drawRailwayTrack(ctx, railwayScreenPts, {
        bufferPixelRadius: railwayBufferPixels,
        showBuffer: true,
        gaugePixels: 5.5,
        sleeperSpacing: 8.5,
        sleeperLength: 11,
        isCurved: isRailwayCurved,
      });

      // Draw interactive handles, midpoints, and kilometer markers
      drawRailwayHandles(ctx, controlRailwayScreenPts, {
        hoveredVertexIndex: hoveredTarget?.type === 'railway' ? hoveredTarget.index : null,
        draggedVertexIndex: draggedTarget?.type === 'railway' ? draggedTarget.index : null,
        hoveredMidpointIndex: hoveredMidpointTarget?.type === 'railway' ? hoveredMidpointTarget.index : null,
        isDrawingMode,
        isActiveAlignment: currentActiveType === 'railway',
      });
    }

    // 6. Measure Tool Overlay
    if (measureMode && measurePoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const mPts = measurePoints.map((p) => project(p[0], p[1], width, height));
      ctx.beginPath();
      ctx.moveTo(mPts[0][0], mPts[0][1]);
      for (let i = 1; i < mPts.length; i++) {
        ctx.lineTo(mPts[i][0], mPts[i][1]);
      }
      ctx.stroke();

      mPts.forEach(([mx, my]) => {
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 7. REAL LIVE USER LOCATION GPS MARKER & ACCURACY BEACON
    if (activeUserLoc) {
      const [gpsX, gpsY] = project(activeUserLoc.longitude, activeUserLoc.latitude, width, height);

      if (gpsX >= -150 && gpsX <= width + 150 && gpsY >= -150 && gpsY <= height + 150) {
        ctx.save();
        const latRad = (activeUserLoc.latitude * Math.PI) / 180;
        const metersPerPx = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
        const radiusPx = Math.max(14, Math.min(300, (activeUserLoc.accuracy || 15) / metersPerPx));

        // GPS Accuracy circle
        ctx.beginPath();
        ctx.arc(gpsX, gpsY, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Outer radar pulse
        ctx.beginPath();
        ctx.arc(gpsX, gpsY, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
        ctx.fill();

        // White border ring
        ctx.beginPath();
        ctx.arc(gpsX, gpsY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Solid blue GPS dot
        ctx.beginPath();
        ctx.arc(gpsX, gpsY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0284C7';
        ctx.fill();

        // Marker label badge
        const badgeText = '📍 YOU (LIVE GPS)';
        ctx.font = 'bold 10px monospace';
        const metrics = ctx.measureText(badgeText);
        const bW = metrics.width + 12;
        const bH = 18;
        const bX = gpsX - bW / 2;
        const bY = gpsY - 26;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 4);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(badgeText, bX + 6, bY + 12);
        ctx.restore();
      }
    }
  }, [
    parcels,
    parcelsLoaded,
    roadCoordinates,
    routeBCoordinates,
    railwayCoordinates,
    intersectedParcelIds,
    selectedParcelId,
    analysisPerformed,
    bufferMeters,
    railwayBufferMeters,
    project,
    zoom,
    measureMode,
    measurePoints,
    mapType,
    isCurved,
    isRouteBCurved,
    isRailwayCurved,
    currentActiveType,
    showRoad,
    showRouteB,
    showRailway,
    optimalRouteId,
    draggedTarget,
    hoveredTarget,
    hoveredMidpointTarget,
    isDrawingMode,
    activeUserLoc,
  ]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderMap();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderMap]);

  // Trigger render on state changes
  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // Register slippy tile load callback to redraw canvas dynamically as tiles stream in
  useEffect(() => {
    tileManager.setTileLoadedCallback(() => {
      renderMap();
    });
  }, [renderMap]);

  // Mouse Down: Check for vertex drag or midpoint insert FIRST
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Check Route A vertices
    if (parcelsLoaded && showRoad && roadCoordinates.length > 0) {
      for (let i = 0; i < roadCoordinates.length; i++) {
        const [vx, vy] = project(roadCoordinates[i][0], roadCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          setDraggedTarget({ type: 'routeA', index: i });
          setIsPanning(false);
          return;
        }
      }
    }

    // 2. Check Route B vertices
    if (parcelsLoaded && showRouteB && routeBCoordinates.length > 0) {
      for (let i = 0; i < routeBCoordinates.length; i++) {
        const [vx, vy] = project(routeBCoordinates[i][0], routeBCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          setDraggedTarget({ type: 'routeB', index: i });
          setIsPanning(false);
          return;
        }
      }
    }

    // 3. Check Railway vertices
    if (parcelsLoaded && showRailway && railwayCoordinates.length > 0) {
      for (let i = 0; i < railwayCoordinates.length; i++) {
        const [vx, vy] = project(railwayCoordinates[i][0], railwayCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          setDraggedTarget({ type: 'railway', index: i });
          setIsPanning(false);
          return;
        }
      }
    }

    // 4. Check Midpoint handles to bend alignment
    if (!isDrawingMode && currentActiveType === 'routeA' && showRoad && roadCoordinates.length >= 2) {
      for (let i = 0; i < roadCoordinates.length - 1; i++) {
        const [p1x, p1y] = project(roadCoordinates[i][0], roadCoordinates[i][1], canvas.width, canvas.height);
        const [p2x, p2y] = project(roadCoordinates[i + 1][0], roadCoordinates[i + 1][1], canvas.width, canvas.height);
        const mx = (p1x + p2x) / 2;
        const my = (p1y + p2y) / 2;
        if (Math.hypot(x - mx, y - my) <= 12) {
          const [newLng, newLat] = unproject(x, y, canvas.width, canvas.height);
          const updated = [...roadCoordinates];
          updated.splice(i + 1, 0, [newLng, newLat]);
          onUpdateRoadCoordinates(updated, false);
          setDraggedTarget({ type: 'routeA', index: i + 1 });
          setIsPanning(false);
          return;
        }
      }
    }

    if (!isDrawingMode && currentActiveType === 'routeB' && showRouteB && routeBCoordinates.length >= 2) {
      for (let i = 0; i < routeBCoordinates.length - 1; i++) {
        const [p1x, p1y] = project(routeBCoordinates[i][0], routeBCoordinates[i][1], canvas.width, canvas.height);
        const [p2x, p2y] = project(routeBCoordinates[i + 1][0], routeBCoordinates[i + 1][1], canvas.width, canvas.height);
        const mx = (p1x + p2x) / 2;
        const my = (p1y + p2y) / 2;
        if (Math.hypot(x - mx, y - my) <= 12) {
          const [newLng, newLat] = unproject(x, y, canvas.width, canvas.height);
          const updated = [...routeBCoordinates];
          updated.splice(i + 1, 0, [newLng, newLat]);
          onUpdateRouteBCoordinates?.(updated, false);
          setDraggedTarget({ type: 'routeB', index: i + 1 });
          setIsPanning(false);
          return;
        }
      }
    }

    if (!isDrawingMode && currentActiveType === 'railway' && showRailway && railwayCoordinates.length >= 2) {
      for (let i = 0; i < railwayCoordinates.length - 1; i++) {
        const [p1x, p1y] = project(railwayCoordinates[i][0], railwayCoordinates[i][1], canvas.width, canvas.height);
        const [p2x, p2y] = project(railwayCoordinates[i + 1][0], railwayCoordinates[i + 1][1], canvas.width, canvas.height);
        const mx = (p1x + p2x) / 2;
        const my = (p1y + p2y) / 2;
        if (Math.hypot(x - mx, y - my) <= 12) {
          const [newLng, newLat] = unproject(x, y, canvas.width, canvas.height);
          const updated = [...railwayCoordinates];
          updated.splice(i + 1, 0, [newLng, newLat]);
          onUpdateRailwayCoordinates?.(updated, false);
          setDraggedTarget({ type: 'railway', index: i + 1 });
          setIsPanning(false);
          return;
        }
      }
    }

    // 5. Pan map if not drawing/measuring
    if (e.button === 0 && !isDrawingMode && !measureMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Mouse Move: Handle vertex dragging OR pan map OR hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // ACTIVE VERTEX DRAG
    if (draggedTarget !== null) {
      const [newLng, newLat] = unproject(x, y, canvas.width, canvas.height);
      if (draggedTarget.type === 'routeA') {
        const updated = [...roadCoordinates];
        updated[draggedTarget.index] = [newLng, newLat];
        onUpdateRoadCoordinates(updated, false);
      } else if (draggedTarget.type === 'routeB') {
        const updated = [...routeBCoordinates];
        updated[draggedTarget.index] = [newLng, newLat];
        onUpdateRouteBCoordinates?.(updated, false);
      } else if (draggedTarget.type === 'railway') {
        const updated = [...railwayCoordinates];
        updated[draggedTarget.index] = [newLng, newLat];
        onUpdateRailwayCoordinates?.(updated, false);
      }
      return;
    }

    // ACTIVE PANNING
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const scale = Math.pow(2, zoom) * 256;
        const dLng = -(dx * (2 * Math.PI)) / ((Math.PI / 180) * scale);
        const dLat = (dy * (2 * Math.PI)) / scale;

        setCenter((prev) => [prev[0] + dLng, prev[1] + dLat]);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
      return;
    }

    // HOVER DETECTION: Detect if mouse is over a vertex or midpoint
    let foundTarget: { type: ActiveCorridorType; index: number } | null = null;

    if (parcelsLoaded && showRoad && roadCoordinates.length > 0) {
      for (let i = 0; i < roadCoordinates.length; i++) {
        const [vx, vy] = project(roadCoordinates[i][0], roadCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          foundTarget = { type: 'routeA', index: i };
          break;
        }
      }
    }

    if (!foundTarget && parcelsLoaded && showRouteB && routeBCoordinates.length > 0) {
      for (let i = 0; i < routeBCoordinates.length; i++) {
        const [vx, vy] = project(routeBCoordinates[i][0], routeBCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          foundTarget = { type: 'routeB', index: i };
          break;
        }
      }
    }

    if (!foundTarget && parcelsLoaded && showRailway && railwayCoordinates.length > 0) {
      for (let i = 0; i < railwayCoordinates.length; i++) {
        const [vx, vy] = project(railwayCoordinates[i][0], railwayCoordinates[i][1], canvas.width, canvas.height);
        if (Math.hypot(x - vx, y - vy) <= 14) {
          foundTarget = { type: 'railway', index: i };
          break;
        }
      }
    }

    setHoveredTarget(foundTarget);

    // Midpoint hover detection (for active alignment)
    if (!foundTarget && !isDrawingMode) {
      let foundMid: { type: ActiveCorridorType; index: number } | null = null;

      if (currentActiveType === 'routeA' && showRoad && roadCoordinates.length >= 2) {
        for (let i = 0; i < roadCoordinates.length - 1; i++) {
          const [p1x, p1y] = project(roadCoordinates[i][0], roadCoordinates[i][1], canvas.width, canvas.height);
          const [p2x, p2y] = project(roadCoordinates[i + 1][0], roadCoordinates[i + 1][1], canvas.width, canvas.height);
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;
          if (Math.hypot(x - mx, y - my) <= 12) {
            foundMid = { type: 'routeA', index: i };
            break;
          }
        }
      } else if (currentActiveType === 'routeB' && showRouteB && routeBCoordinates.length >= 2) {
        for (let i = 0; i < routeBCoordinates.length - 1; i++) {
          const [p1x, p1y] = project(routeBCoordinates[i][0], routeBCoordinates[i][1], canvas.width, canvas.height);
          const [p2x, p2y] = project(routeBCoordinates[i + 1][0], routeBCoordinates[i + 1][1], canvas.width, canvas.height);
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;
          if (Math.hypot(x - mx, y - my) <= 12) {
            foundMid = { type: 'routeB', index: i };
            break;
          }
        }
      } else if (currentActiveType === 'railway' && showRailway && railwayCoordinates.length >= 2) {
        for (let i = 0; i < railwayCoordinates.length - 1; i++) {
          const [p1x, p1y] = project(railwayCoordinates[i][0], railwayCoordinates[i][1], canvas.width, canvas.height);
          const [p2x, p2y] = project(railwayCoordinates[i + 1][0], railwayCoordinates[i + 1][1], canvas.width, canvas.height);
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;
          if (Math.hypot(x - mx, y - my) <= 12) {
            foundMid = { type: 'railway', index: i };
            break;
          }
        }
      }

      setHoveredMidpointTarget(foundMid);
    } else {
      setHoveredMidpointTarget(null);
    }
  };

  // Mouse Up: Finish dragging and notify that alignment was updated
  const handleMouseUp = () => {
    if (draggedTarget !== null) {
      if (draggedTarget.type === 'routeA') {
        onUpdateRoadCoordinates(roadCoordinates, true);
      } else if (draggedTarget.type === 'routeB') {
        onUpdateRouteBCoordinates?.(routeBCoordinates, true);
      } else if (draggedTarget.type === 'railway') {
        onUpdateRailwayCoordinates?.(railwayCoordinates, true);
      }
      setDraggedTarget(null);
    }
    setIsPanning(false);
    setPanStart(null);
  };

  // Mouse Click: Add point when drawing or hit-test parcels
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (measureMode) {
      const [lng, lat] = unproject(x, y, canvas.width, canvas.height);
      setMeasurePoints([...measurePoints, [lng, lat]]);
      return;
    }

    if (isDrawingMode) {
      const [lng, lat] = unproject(x, y, canvas.width, canvas.height);
      if (currentActiveType === 'routeA') {
        onUpdateRoadCoordinates([...roadCoordinates, [lng, lat]], true);
      } else if (currentActiveType === 'routeB') {
        onUpdateRouteBCoordinates?.([...routeBCoordinates, [lng, lat]], true);
      } else if (currentActiveType === 'railway') {
        onUpdateRailwayCoordinates?.([...railwayCoordinates, [lng, lat]], true);
      }
      return;
    }

    // Selection mode: hit-test parcels
    if (parcelsLoaded && parcels.length > 0 && hoveredTarget === null && hoveredMidpointTarget === null) {
      let hitParcel: CadastralParcel | null = null;

      for (const p of parcels) {
        if (!p.coordinates) continue;
        const pts = p.coordinates.map((c) => project(c[0], c[1], canvas.width, canvas.height));
        if (isPointInPolygon(x, y, pts)) {
          hitParcel = p;
          break;
        }
      }

      onSelectParcel(hitParcel);
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => Math.max(3, Math.min(19, prev + zoomDelta)));
  };

  // Active Alignment Actions
  const handleUndoVertex = () => {
    if (currentActiveType === 'routeA' && roadCoordinates.length > 0) {
      onUpdateRoadCoordinates(roadCoordinates.slice(0, -1), true);
    } else if (currentActiveType === 'routeB' && routeBCoordinates.length > 0) {
      onUpdateRouteBCoordinates?.(routeBCoordinates.slice(0, -1), true);
    } else if (currentActiveType === 'railway' && railwayCoordinates.length > 0) {
      onUpdateRailwayCoordinates?.(railwayCoordinates.slice(0, -1), true);
    }
  };

  const handleClearActiveAlignment = () => {
    if (currentActiveType === 'routeA') {
      onUpdateRoadCoordinates([], true);
    } else if (currentActiveType === 'routeB') {
      onUpdateRouteBCoordinates?.([], true);
    } else if (currentActiveType === 'railway') {
      onUpdateRailwayCoordinates?.([], true);
    }
  };

  // Preset Helpers
  const handleLoadSampleAlignment = () => {
    if (currentActiveType === 'routeA') {
      onUpdateRoadCoordinates(DEFAULT_ROUTE_A_ALIGNMENT, true);
    } else if (currentActiveType === 'routeB') {
      onUpdateRouteBCoordinates?.(DEFAULT_ROUTE_B_ALIGNMENT, true);
    } else if (currentActiveType === 'railway') {
      onUpdateRailwayCoordinates?.(DEFAULT_RAILWAY_ALIGNMENT, true);
    }
  };

  // Reset view
  const handleResetView = () => {
    setCenter([80.1275, 12.7820]);
    setZoom(16.4);
  };

  // Dynamic cursor style based on hover & drag states
  const getCursorStyle = () => {
    if (draggedTarget !== null) return 'cursor-grabbing';
    if (hoveredTarget !== null) return 'cursor-grab';
    if (hoveredMidpointTarget !== null) return 'cursor-copy';
    if (isDrawingMode) return 'cursor-crosshair';
    if (isPanning) return 'cursor-grabbing';
    return 'cursor-grab';
  };

  // Active coordinates & curve handler mapping
  const activeCoords = currentActiveType === 'routeA' 
    ? roadCoordinates 
    : currentActiveType === 'routeB' 
    ? routeBCoordinates 
    : railwayCoordinates;

  const activeIsCurved = currentActiveType === 'routeA' 
    ? isCurved 
    : currentActiveType === 'routeB' 
    ? isRouteBCurved 
    : isRailwayCurved;

  const toggleActiveCurved = currentActiveType === 'routeA' 
    ? onToggleCurved 
    : currentActiveType === 'routeB' 
    ? onToggleRouteBCurved 
    : onToggleRailwayCurved;

  const activeLabel = currentActiveType === 'routeA' 
    ? 'Route A' 
    : currentActiveType === 'routeB' 
    ? 'Route B' 
    : 'Railway Track';

  return (
    <div
      ref={containerRef}
      id="gis-map-container"
      className="relative w-full h-[620px] bg-[#1a231d] overflow-hidden select-none"
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        id="gis-canvas-viewport"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full block ${getCursorStyle()}`}
      />

      {/* ON-MAP SELECTED PARCEL IMPACT HUD NOTIFIER */}
      {selectedParcelId && selectedParcelImpact && (
        <div
          id="selected-parcel-impact-hud"
          className={`absolute top-16 left-6 z-20 pointer-events-auto backdrop-blur-md px-3.5 py-2 rounded-lg border shadow-xl flex items-center gap-3 transition-all ${
            selectedParcelImpact.isAffected
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/50'
              : selectedParcelImpact.hasCorridors
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-emerald-950/50'
              : 'bg-[#0B192C]/95 border-[#1E3E62] text-slate-200'
          }`}
        >
          {selectedParcelImpact.isAffected ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-bold text-xs font-technical text-white">
                PARCEL {selectedParcelId}:
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white font-technical">
                ⚠️ AFFECTED
              </span>
              <span className="text-[11px] font-technical text-rose-200">
                {selectedParcelImpact.affectedCorridors.join(' & ')}
              </span>
            </div>
          ) : selectedParcelImpact.hasCorridors ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-xs font-technical text-white">
                PARCEL {selectedParcelId}:
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white font-technical">
                ✓ NOT AFFECTED
              </span>
              <span className="text-[11px] font-technical text-emerald-200">
                Safely clear of all corridors
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span className="font-bold text-xs font-technical text-white">
                PARCEL {selectedParcelId} SELECTED
              </span>
              <span className="text-[11px] font-technical text-slate-300">
                Draw or load corridors to evaluate impact
              </span>
            </div>
          )}

          <button
            id="dismiss-selected-parcel-hud-btn"
            onClick={() => onSelectParcel(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors ml-1"
            title="Deselect parcel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP FLOATING CADASTRE & ALIGNMENT HUD BAR */}
      <div 
        id="gis-top-hud-bar"
        className="absolute top-4 inset-x-6 flex items-center justify-between pointer-events-none z-10"
      >
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-[#0B192C]/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#1E3E62] shadow-xl text-white">
          
          {/* Corridor Selection Mode: Route A vs Route B vs Railway Track */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-md border border-slate-700/60 mr-1">
            {/* Route A Button */}
            <button
              id="select-route-a-corridor-btn"
              onClick={() => setCorridorType('routeA')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
                currentActiveType === 'routeA'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Work with Route A (Road 1) corridor"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Route A {roadCoordinates.length > 0 ? `(${roadCoordinates.length})` : ''}</span>
              {optimalRouteId === 'routeA' && (
                <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" title="Selected Optimal Route" />
              )}
            </button>

            {/* Route B Button */}
            <button
              id="select-route-b-corridor-btn"
              onClick={() => setCorridorType('routeB')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
                currentActiveType === 'routeB'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Work with Route B (Road 2) corridor"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Route B {routeBCoordinates.length > 0 ? `(${routeBCoordinates.length})` : ''}</span>
              {optimalRouteId === 'routeB' && (
                <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" title="Selected Optimal Route" />
              )}
            </button>

            {/* Railway Button */}
            <button
              id="select-railway-corridor-btn"
              onClick={() => setCorridorType('railway')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
                currentActiveType === 'railway'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Work with 2-line Railway Track corridor"
            >
              <Train className="w-3.5 h-3.5" />
              <span>Railway {railwayCoordinates.length > 0 ? `(${railwayCoordinates.length})` : ''}</span>
            </button>
          </div>

          {/* Drawing Mode Toggle Button */}
          <button
            id="toggle-draw-mode-btn"
            disabled={!parcelsLoaded}
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold font-technical tracking-wide transition-colors ${
              !parcelsLoaded
                ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/40'
                : isDrawingMode
                ? currentActiveType === 'routeA'
                  ? 'bg-[#0284C7] text-white shadow-md ring-2 ring-sky-400/40'
                  : currentActiveType === 'routeB'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
            title={!parcelsLoaded ? 'Load parcels first to enable drawing' : `Toggle drawing for ${activeLabel}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>
              {isDrawingMode 
                ? `DRAWING ${activeLabel.toUpperCase()} ACTIVE` 
                : `Draw ${activeLabel}`
              }
            </span>
          </button>

          {/* CURVED ALIGNMENT TOGGLE BUTTON */}
          {parcelsLoaded && activeCoords.length >= 2 && toggleActiveCurved && (
            <button
              id="toggle-curved-road-btn"
              onClick={() => toggleActiveCurved(!activeIsCurved)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold font-technical tracking-wide transition-colors border ${
                activeIsCurved
                  ? currentActiveType === 'routeA'
                    ? 'bg-sky-600/80 hover:bg-sky-600 text-white border-sky-400 shadow-sm'
                    : currentActiveType === 'routeB'
                    ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-purple-600/80 hover:bg-purple-600 text-white border-purple-400 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-slate-600/40'
              }`}
              title="Toggle between straight tangents and smooth horizontal curves"
            >
              <Spline className="w-3.5 h-3.5 text-sky-300" />
              <span>{activeIsCurved ? 'Curved Spline' : 'Straight Tangents'}</span>
            </button>
          )}

          <span className="text-slate-500 font-technical">|</span>

          {/* Status & Drag Instructions */}
          <div className="text-[11px] text-slate-300 font-technical hidden sm:flex items-center gap-1.5">
            {!parcelsLoaded ? (
              <span className="text-amber-400 font-medium">Step 1: Click &quot;Load Land Parcels&quot; above to begin.</span>
            ) : isDrawingMode ? (
              <>
                <span className={`w-2 h-2 rounded-full ${
                  currentActiveType === 'routeA' ? 'bg-sky-400' : currentActiveType === 'routeB' ? 'bg-emerald-400' : 'bg-purple-400'
                } animate-pulse`}></span>
                <span className={
                  currentActiveType === 'routeA' ? 'text-sky-300' : currentActiveType === 'routeB' ? 'text-emerald-300' : 'text-purple-300'
                }>
                  Click map to place {activeLabel} vertices ({activeCoords.length} placed)
                </span>
              </>
            ) : activeCoords.length > 0 ? (
              <span className="flex items-center gap-1 text-slate-200">
                <Move className={`w-3 h-3 ${
                  currentActiveType === 'routeA' ? 'text-sky-400' : currentActiveType === 'routeB' ? 'text-emerald-400' : 'text-purple-400'
                }`} />
                <span>Drag any vertex or midpoint to bend {activeLabel} in real time</span>
              </span>
            ) : (
              <span>Cadastre loaded ({parcels.length} parcels) • Click &quot;Draw {activeLabel}&quot; to begin</span>
            )}
          </div>

          {/* Preset Helper */}
          {parcelsLoaded && activeCoords.length === 0 && (
            <button
              id="load-sample-corridor-btn"
              onClick={handleLoadSampleAlignment}
              className="ml-2 text-[11px] text-sky-400 hover:text-sky-300 underline font-technical"
            >
              Load Sample {activeLabel}
            </button>
          )}

          {/* Drawing Operation Buttons */}
          {parcelsLoaded && (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                id="undo-vertex-btn"
                disabled={activeCoords.length === 0}
                onClick={handleUndoVertex}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={`Undo last ${activeLabel} vertex`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                id="clear-alignment-btn"
                disabled={activeCoords.length === 0}
                onClick={handleClearActiveAlignment}
                className="p-1.5 text-slate-300 hover:text-rose-400 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={`Clear ${activeLabel} alignment`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {isDrawingMode && (
                <button
                  id="finish-drawing-btn"
                  onClick={() => setIsDrawingMode(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
              )}
            </div>
          )}

          {/* 5. FRONTEND SPATIAL ANALYSIS TRIGGER BUTTON */}
          <button
            id="analyze-affected-land-btn"
            disabled={!parcelsLoaded || (roadCoordinates.length < 2 && routeBCoordinates.length < 2 && railwayCoordinates.length < 2)}
            onClick={onRunAnalysis}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md ${
              !parcelsLoaded || (roadCoordinates.length < 2 && routeBCoordinates.length < 2 && railwayCoordinates.length < 2)
                ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30'
                : 'bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-slate-950 font-technical'
            }`}
            title={
              !parcelsLoaded
                ? 'Load parcels first'
                : 'Perform frontend GIS intersection analysis'
            }
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Analyze Affected Land →</span>
          </button>
        </div>
      </div>

      {/* LEFT FLOATING GIS TOOLS HUD */}
      <div 
        id="gis-map-tools-hud"
        className="absolute top-20 left-6 flex flex-col gap-1.5 z-10"
      >
        <div className="bg-white rounded-lg border border-slate-200 shadow-md p-1 flex flex-col gap-1">
          <button
            id="zoom-in-btn"
            onClick={() => setZoom((prev) => Math.min(19, prev + 0.5))}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            id="zoom-out-btn"
            onClick={() => setZoom((prev) => Math.max(3, prev - 0.5))}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 my-0.5"></div>
          <button
            id="reset-view-btn"
            onClick={handleResetView}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="Reset to Cadastral Center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            id="toggle-measure-btn"
            onClick={() => {
              setMeasureMode(!measureMode);
              setMeasurePoints([]);
            }}
            className={`p-2 rounded transition-colors ${
              measureMode ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Distance Measurement Tool"
          >
            <Ruler className="w-4 h-4" />
          </button>

          <div className="h-px bg-slate-200 my-0.5"></div>

          {/* USER REQUEST: Real GPS Live Location Button */}
          <button
            id="gps-locate-me-btn"
            onClick={handleLocateUser}
            disabled={isLoadingLocation}
            className={`p-2 rounded transition-all relative ${
              isLoadingLocation
                ? 'bg-sky-100 text-sky-600 animate-pulse'
                : activeUserLoc
                ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600'
            }`}
            title={activeUserLoc ? `GPS Active: ${activeUserLoc.latitude.toFixed(4)}, ${activeUserLoc.longitude.toFixed(4)}` : 'Locate My Real Position (GPS)'}
          >
            <LocateFixed className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            {activeUserLoc && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300"></span>
            )}
          </button>

          {/* USER REQUEST: Real-Life Map & External Links Modal */}
          <button
            id="open-real-maps-btn"
            onClick={() => setIsRealMapModalOpen(true)}
            className="p-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors"
            title="Real Life Maps (Google Maps, Satellite, Street View & OSM)"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP-RIGHT REAL LOCATION FLOATING CARD (When GPS acquired) */}
      {activeUserLoc && (
        <div 
          id="user-live-location-badge"
          className="absolute top-20 right-6 bg-[#0B192C]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-sky-500/40 text-white shadow-xl z-10 max-w-sm"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#1E3E62] pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                📍 Live Real Position
              </span>
            </div>
            <button
              onClick={() => setIsRealMapModalOpen(true)}
              className="text-[10px] text-sky-400 hover:text-sky-200 underline font-medium flex items-center gap-0.5"
            >
              Real Map <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="text-xs text-slate-200">
            <div className="font-semibold text-white truncate">
              {activeUserLoc.city ? `${activeUserLoc.city}, ${activeUserLoc.state || activeUserLoc.country || ''}` : activeUserLoc.address || 'Real GPS Position'}
            </div>
            <div className="text-[11px] text-slate-400 font-technical mt-0.5 flex items-center gap-2">
              <span>{activeUserLoc.latitude.toFixed(5)}°N, {activeUserLoc.longitude.toFixed(5)}°E</span>
              <span className="text-emerald-400 font-medium">±{activeUserLoc.accuracy}m</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[#1E3E62]/70">
            <button
              onClick={() => handleFlyToLocation(activeUserLoc.latitude, activeUserLoc.longitude)}
              className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold rounded transition-colors"
            >
              Re-Center Here
            </button>
            {onLoadParcelsAtLocation && (
              <button
                onClick={() => onLoadParcelsAtLocation(activeUserLoc.latitude, activeUserLoc.longitude)}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-semibold rounded transition-colors"
                title="Generate cadastral boundary parcels around your real coordinates"
              >
                Cadastre Around Me
              </button>
            )}
          </div>
        </div>
      )}

      {/* LOCATION ERROR TOAST */}
      {locationError && (
        <div className="absolute top-20 right-6 bg-rose-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-lg border border-rose-500 text-xs shadow-xl z-20 flex items-center gap-2 max-w-sm">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* BOTTOM-LEFT BASEMAP PICKER: OpenStreetMap, Satellite, OSM Clean, Hybrid */}
      <div 
        id="basemap-selector-group"
        className="absolute bottom-4 left-6 z-20 flex items-center bg-[#0B192C]/90 backdrop-blur-md rounded-lg p-1 border border-[#1E3E62] shadow-xl text-xs gap-1 font-technical"
      >
        <button
          onClick={() => setMapType('osm')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
            mapType === 'osm'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Official OpenStreetMap Standard Live Cartography"
        >
          <MapIcon className="w-3.5 h-3.5 text-sky-300" />
          <span>OpenStreetMap</span>
        </button>

        <button
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
            mapType === 'satellite'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Global Esri World Satellite Imagery"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setMapType('streets')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
            mapType === 'streets'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="CartoDB / OpenStreetMap High-Clarity Street Map"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>OSM Clean</span>
        </button>

        <button
          onClick={() => setMapType('hybrid')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
            mapType === 'hybrid'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Satellite Imagery with Street and City Labels"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Hybrid</span>
        </button>
      </div>

      {/* BOTTOM-LEFT FLOATING LEGEND */}
      <div 
        id="map-cadastral-legend"
        className="absolute bottom-4 left-22 bg-[#0B192C]/90 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-[#1E3E62] text-white text-xs font-technical shadow-xl z-10 pointer-events-auto"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#1E3E62] pb-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CADASTRAL LAYER &amp; ALIGNMENT
          </span>
          <span className="text-[10px] text-sky-400 font-semibold">Row: {bufferMeters}m</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {/* Route A Alignment */}
          {showRoad && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-[#0284C7] rounded-xs border border-sky-300 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-white"></div>
                </div>
                <span className="text-slate-200">
                  Route A ({isCurved ? 'Curved' : 'Tangent'})
                </span>
              </div>
              {optimalRouteId === 'routeA' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                  OPTIMAL 🏆
                </span>
              )}
            </div>
          )}

          {/* Route B Alignment */}
          {showRouteB && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-emerald-600 rounded-xs border border-emerald-300 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-yellow-200"></div>
                </div>
                <span className="text-emerald-300">
                  Route B ({isRouteBCurved ? 'Curved' : 'Tangent'})
                </span>
              </div>
              {optimalRouteId === 'routeB' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                  OPTIMAL 🏆
                </span>
              )}
            </div>
          )}

          {/* Railway Alignment */}
          {showRailway && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-2.5 bg-stone-700/90 rounded-xs border border-stone-500 relative flex items-center justify-between px-0.5">
                <div className="absolute inset-x-0 top-[2px] h-[1px] bg-slate-100"></div>
                <div className="absolute inset-x-0 bottom-[2px] h-[1px] bg-slate-100"></div>
                <div className="w-[1px] h-full bg-stone-400 z-1"></div>
                <div className="w-[1px] h-full bg-stone-400 z-1"></div>
                <div className="w-[1px] h-full bg-stone-400 z-1"></div>
              </div>
              <span className="text-purple-300">
                Railway Track (Dual Rail + Ties)
              </span>
            </div>
          )}

          {/* Intersected Parcel */}
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-amber-500/25 border border-amber-500 rounded-xs"></div>
            <span className="text-amber-400">
              Intersected Parcel {analysisPerformed ? `(${intersectedParcelIds.length})` : ''}
            </span>
          </div>

          {/* Cadastral Parcel */}
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-white/5 border border-slate-400/60 rounded-xs"></div>
            <span className="text-slate-300">
              Cadastral Parcel {parcelsLoaded ? `(${parcels.length})` : ''}
            </span>
          </div>

          {/* Selected Parcel */}
          {selectedParcelId && (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#0284C7]/40 border-2 border-[#38BDF8] rounded-xs"></div>
              <span className="text-sky-300 font-semibold">Selected Parcel ({selectedParcelId})</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM-RIGHT SCALE BAR & REAL-WORLD ATTRIBUTION */}
      <div className="absolute bottom-3 right-6 flex items-center gap-3 z-10 pointer-events-none">
        <span className="text-white/80 font-medium text-[10px] font-technical select-none drop-shadow-sm flex items-center gap-1.5">
          {mapType === 'osm' || mapType === 'streets' ? (
            <a 
              href="https://www.openstreetmap.org/copyright" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline pointer-events-auto text-sky-300"
            >
              © OpenStreetMap contributors
            </a>
          ) : (
            <span>Source: Esri, Maxar, Earthstar Geographics</span>
          )}
        </span>

        <div 
          id="map-scale-bar"
          className="bg-[#0B192C]/90 backdrop-blur-md px-3 py-1.5 rounded border border-[#1E3E62] text-slate-300 text-[10px] font-technical flex items-center gap-3 shadow-lg pointer-events-auto"
        >
          <span className="text-sky-400 font-semibold">◆ 1:5,000</span>
          <span className="text-slate-500">•</span>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-1 bg-white border border-slate-900"></div>
            <span>100m</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="font-bold text-sky-400 flex items-center gap-0.5">
            <Navigation className="w-2.5 h-2.5" /> N
          </span>
        </div>
      </div>

      {/* USER REQUEST: Real-Life Map Modal with Google Maps, Earth, OSM, Live Links & Iframe */}
      <RealLifeMapModal
        isOpen={isRealMapModalOpen}
        onClose={() => setIsRealMapModalOpen(false)}
        userLocation={activeUserLoc}
        center={center}
        zoom={zoom}
        onSelectLocation={(lat, lng) => {
          setCenter([lng, lat]);
          setZoom(16.5);
        }}
      />
    </div>
  );
};
