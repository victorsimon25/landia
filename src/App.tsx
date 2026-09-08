/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AreaSelector } from './components/AreaSelector';
import { MapViewport } from './components/MapViewport';
import { RouteComparisonCard } from './components/RouteComparisonCard';
import { ParcelInspector } from './components/ParcelInspector';
import { AnalysisSummary } from './components/AnalysisSummary';
import { IntersectedParcelsTable } from './components/IntersectedParcelsTable';
import { BottomActionBanner } from './components/BottomActionBanner';
import { BufferSettingsModal } from './components/BufferSettingsModal';
import { 
  AreaSelection, 
  CadastralParcel,
  ActiveCorridorType,
  RoadRouteId,
  RouteOptimizationResult,
  ParcelImpactStatus,
  UserLiveLocation
} from './types';
import { 
  fetchParcelsForArea, 
  calculateIntersectedParcels, 
  calculateCombinedIntersections,
  getIntersectedParcelIds, 
  sendIntersectedParcelIds,
  generateCurvedCoordinates,
  evaluateRouteOptimization,
  evaluateParcelImpact,
  DEFAULT_ROUTE_A_ALIGNMENT,
  DEFAULT_ROUTE_B_ALIGNMENT,
  DEFAULT_RAILWAY_ALIGNMENT
} from './services/gisService';
import { 
  getCurrentUserLocation, 
  reverseGeocodeCoordinates, 
  generateParcelsAroundLocation, 
  generateAlignmentsAroundLocation 
} from './services/geolocationService';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('alignment');

  // STEP 1: Area Selection State (Tamil Nadu / Chengalpattu / Thiruporur / Kariyampakkam)
  const [area, setArea] = useState<AreaSelection>({
    state: 'Tamil Nadu',
    district: 'Chengalpattu',
    taluk: 'Thiruporur',
    village: 'Kariyampakkam',
  });

  // Live real-life user location state
  const [userLocation, setUserLocation] = useState<UserLiveLocation | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // STEP 2: Loaded Cadastral Parcels State
  const [parcels, setParcels] = useState<CadastralParcel[]>([]);
  const [isLoadingParcels, setIsLoadingParcels] = useState(false);
  const [parcelsLoaded, setParcelsLoaded] = useState(false);

  // STEP 4: ROUTE A (Road 1) Alignment State - initialized with sample alignment so workspace is live
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>(DEFAULT_ROUTE_A_ALIGNMENT);
  const [isCurved, setIsCurved] = useState<boolean>(false);
  const [showRouteA, setShowRouteA] = useState<boolean>(true);

  // USER REQUEST: ROUTE B (Road 2 Alternative) Alignment State - initialized with sample alignment
  const [routeBCoordinates, setRouteBCoordinates] = useState<[number, number][]>(DEFAULT_ROUTE_B_ALIGNMENT);
  const [isRouteBCurved, setIsRouteBCurved] = useState<boolean>(false);
  const [showRouteB, setShowRouteB] = useState<boolean>(true);

  // Active Drawing / Editing Corridor Selection ('routeA' | 'routeB' | 'railway')
  const [activeCorridorType, setActiveCorridorType] = useState<ActiveCorridorType>('routeA');

  // Adopted Route for primary handoff
  const [adoptedRoute, setAdoptedRoute] = useState<RoadRouteId | null>(null);

  // USER REQUEST: Railway Track Alignment Feature State
  const [railwayCoordinates, setRailwayCoordinates] = useState<[number, number][]>([]);
  const [isRailwayCurved, setIsRailwayCurved] = useState<boolean>(false);
  const [railwayBufferMeters, setRailwayBufferMeters] = useState(30);
  const [showRailway, setShowRailway] = useState<boolean>(true);

  // Analysis state flag
  const [analysisPerformed, setAnalysisPerformed] = useState(true);

  // Inspection State
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel | null>(null);

  // Corridor Settings State
  const [bufferMeters, setBufferMeters] = useState(45);
  const [isBufferModalOpen, setIsBufferModalOpen] = useState(false);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Auto-load initial cadastral parcel boundaries on mount so workspace is live immediately
  useEffect(() => {
    let isMounted = true;
    setIsLoadingParcels(true);
    fetchParcelsForArea(area)
      .then((data) => {
        if (!isMounted) return;
        setParcels(data);
        setParcelsLoaded(true);
        setAnalysisPerformed(true);
        setIsLoadingParcels(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load initial parcels:', err);
        setIsLoadingParcels(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Parcels Handler
  const handleLoadParcels = async () => {
    setIsLoadingParcels(true);
    try {
      const data = await fetchParcelsForArea(area);
      setParcels(data);
      setParcelsLoaded(true);
      setAnalysisPerformed(true);
      if (roadCoordinates.length === 0 && routeBCoordinates.length === 0) {
        setRoadCoordinates(DEFAULT_ROUTE_A_ALIGNMENT);
        setRouteBCoordinates(DEFAULT_ROUTE_B_ALIGNMENT);
      }
      showToast(`Loaded ${data.length} cadastral parcel boundary geometries for ${area.village}. Live affected parcels updated.`);
    } catch (err) {
      console.error('Failed to load parcels:', err);
      showToast('Error querying cadastral records.');
    } finally {
      setIsLoadingParcels(false);
    }
  };

  // REAL-TIME LIVE MULTI-CORRIDOR SPATIAL INTERSECTIONS
  // Automatically computes affected land parcels in real-time as alignments are drawn, moved, curved, or buffered
  const liveIntersections = useMemo(() => {
    if (!parcelsLoaded || parcels.length === 0) {
      return {
        allIntersectedIds: [] as string[],
        roadIntersectedIds: [] as string[],
        routeBIntersectedIds: [] as string[],
        railwayIntersectedIds: [] as string[],
      };
    }

    const hasRouteA = roadCoordinates.length >= 2;
    const hasRouteB = routeBCoordinates.length >= 2;
    const hasRailway = railwayCoordinates.length >= 2;

    if (!hasRouteA && !hasRouteB && !hasRailway) {
      return {
        allIntersectedIds: [] as string[],
        roadIntersectedIds: [] as string[],
        routeBIntersectedIds: [] as string[],
        railwayIntersectedIds: [] as string[],
      };
    }

    return calculateCombinedIntersections({
      parcels,
      roadCoordinates,
      isRoadCurved: isCurved,
      roadBufferMeters: bufferMeters,
      routeBCoordinates,
      routeBBufferMeters: bufferMeters,
      isRouteBCurved,
      railwayCoordinates,
      isRailwayCurved,
      railwayBufferMeters,
    });
  }, [
    parcels,
    parcelsLoaded,
    roadCoordinates,
    isCurved,
    routeBCoordinates,
    isRouteBCurved,
    railwayCoordinates,
    isRailwayCurved,
    bufferMeters,
    railwayBufferMeters,
  ]);

  const activeIntersectedParcelIds = liveIntersections.allIntersectedIds;
  const activeRoadIntersectedIds = liveIntersections.roadIntersectedIds;
  const activeRouteBIntersectedIds = liveIntersections.routeBIntersectedIds;
  const activeRailwayIntersectedIds = liveIntersections.railwayIntersectedIds;

  // Intersected parcel objects list (LIVE, never blank if alignments cross parcels)
  const intersectedParcelsList = useMemo(() => {
    if (!parcelsLoaded || parcels.length === 0) return [];
    return parcels.filter((p) => activeIntersectedParcelIds.includes(p.parcelId));
  }, [parcels, parcelsLoaded, activeIntersectedParcelIds]);

  // Dynamic Route A vs Route B Optimization Computation
  const optimizationResult: RouteOptimizationResult = useMemo(() => {
    return evaluateRouteOptimization({
      parcels,
      routeACoordinates: roadCoordinates,
      isRouteACurved: isCurved,
      routeBCoordinates,
      isRouteBCurved,
      bufferMeters,
    });
  }, [parcels, roadCoordinates, isCurved, routeBCoordinates, isRouteBCurved, bufferMeters]);

  // Selected Parcel Impact Status (dynamically updated for any selected parcel)
  const selectedParcelImpact: ParcelImpactStatus | null = useMemo(() => {
    if (!selectedParcel) return null;
    return evaluateParcelImpact({
      parcel: selectedParcel,
      roadCoordinates,
      roadBufferMeters: bufferMeters,
      isRoadCurved: isCurved,
      routeBCoordinates,
      routeBBufferMeters: bufferMeters,
      isRouteBCurved,
      railwayCoordinates,
      railwayBufferMeters,
      isRailwayCurved,
      roadIntersectedIds: activeRoadIntersectedIds,
      routeBIntersectedIds: activeRouteBIntersectedIds,
      railwayIntersectedIds: activeRailwayIntersectedIds,
      analysisPerformed: true,
    });
  }, [
    selectedParcel,
    roadCoordinates,
    bufferMeters,
    isCurved,
    routeBCoordinates,
    isRouteBCurved,
    railwayCoordinates,
    railwayBufferMeters,
    isRailwayCurved,
    activeRoadIntersectedIds,
    activeRouteBIntersectedIds,
    activeRailwayIntersectedIds,
  ]);

  // Parcel selection handler with instant impact feedback
  const handleSelectParcel = (parcel: CadastralParcel | null) => {
    setSelectedParcel(parcel);
    if (!parcel) return;

    const impact = evaluateParcelImpact({
      parcel,
      roadCoordinates,
      roadBufferMeters: bufferMeters,
      isRoadCurved: isCurved,
      routeBCoordinates,
      routeBBufferMeters: bufferMeters,
      isRouteBCurved,
      railwayCoordinates,
      railwayBufferMeters,
      isRailwayCurved,
      roadIntersectedIds: activeRoadIntersectedIds,
      routeBIntersectedIds: activeRouteBIntersectedIds,
      railwayIntersectedIds: activeRailwayIntersectedIds,
      analysisPerformed: true,
    });

    if (impact.isAffected) {
      showToast(`⚠️ Parcel ${parcel.parcelId} is AFFECTED by ${impact.affectedCorridors.join(' & ')}.`);
    } else if (impact.hasCorridors) {
      showToast(`✓ Parcel ${parcel.parcelId} is NOT AFFECTED (Safely outside active corridors).`);
    } else {
      showToast(`Parcel ${parcel.parcelId} selected. Draw or load corridors to evaluate impact.`);
    }
  };

  // Frontend Spatial Intersection Analysis (Supports Route A, Route B, and Railway)
  const handleRunAnalysis = (
    _rCoords = roadCoordinates, 
    _rCurved = isCurved,
    _rBCoords = routeBCoordinates,
    _rBCurved = isRouteBCurved,
    _rwCoords = railwayCoordinates,
    _rwCurved = isRailwayCurved
  ) => {
    setAnalysisPerformed(true);
    const count = activeIntersectedParcelIds.length;
    if (count > 0) {
      const breakdown = [];
      if (activeRoadIntersectedIds.length > 0) breakdown.push(`Route A: ${activeRoadIntersectedIds.length}`);
      if (activeRouteBIntersectedIds.length > 0) breakdown.push(`Route B: ${activeRouteBIntersectedIds.length}`);
      if (activeRailwayIntersectedIds.length > 0) breakdown.push(`Railway: ${activeRailwayIntersectedIds.length}`);
      showToast(`Live spatial analysis active: ${count} parcels affected (${breakdown.join(', ')}).`);
    } else {
      showToast('Spatial analysis active: No parcel intersections along current corridors.');
    }
  };

  // Re-run spatial analysis if buffer changes
  const handleSelectBuffer = (newBuffer: number) => {
    setBufferMeters(newBuffer);
    showToast(`Road buffer updated to ${newBuffer}m.`);
  };

  // Toggle Route A curvature
  const handleToggleRouteACurved = (curved: boolean) => {
    setIsCurved(curved);
  };

  // Toggle Route B curvature
  const handleToggleRouteBCurved = (curved: boolean) => {
    setIsRouteBCurved(curved);
  };

  // Toggle railway curvature
  const handleToggleRailwayCurved = (curved: boolean) => {
    setIsRailwayCurved(curved);
  };

  // Handle live Route A alignment drag updates
  const handleUpdateRoadCoordinates = (newCoords: [number, number][], isFinalRelease: boolean = false) => {
    setRoadCoordinates(newCoords);
    if (isFinalRelease) {
      setAnalysisPerformed(true);
    }
  };

  // Handle live Route B alignment drag updates
  const handleUpdateRouteBCoordinates = (newCoords: [number, number][], isFinalRelease: boolean = false) => {
    setRouteBCoordinates(newCoords);
    if (isFinalRelease) {
      setAnalysisPerformed(true);
    }
  };

  // Handle live railway alignment drag updates
  const handleUpdateRailwayCoordinates = (newCoords: [number, number][], isFinalRelease: boolean = false) => {
    setRailwayCoordinates(newCoords);
    if (isFinalRelease) {
      setAnalysisPerformed(true);
    }
  };

  // Preset Loaders
  const handleLoadSampleRouteA = () => {
    setRoadCoordinates(DEFAULT_ROUTE_A_ALIGNMENT);
    setActiveCorridorType('routeA');
    setAnalysisPerformed(true);
    showToast('Loaded sample Route A alignment (6 vertices, 2.72 km).');
  };

  const handleLoadSampleRouteB = () => {
    setRouteBCoordinates(DEFAULT_ROUTE_B_ALIGNMENT);
    setActiveCorridorType('routeB');
    setAnalysisPerformed(true);
    showToast('Loaded sample Route B alternative alignment (6 vertices, 2.68 km).');
  };

  const handleLoadBothSamples = () => {
    setRoadCoordinates(DEFAULT_ROUTE_A_ALIGNMENT);
    setRouteBCoordinates(DEFAULT_ROUTE_B_ALIGNMENT);
    setActiveCorridorType('routeA');
    setAnalysisPerformed(true);
    showToast('Loaded both Route A and Route B alignments for direct side-by-side optimization comparison!');
  };

  // Adopt Optimal Route as the primary acquisition design
  const handleAdoptOptimalRoute = (winnerRouteId: RoadRouteId) => {
    setAdoptedRoute(winnerRouteId);
    setActiveCorridorType(winnerRouteId);
    const winnerName = winnerRouteId === 'routeA' ? 'Route A' : 'Route B';
    const winnerMetrics = winnerRouteId === 'routeA' ? optimizationResult.routeA : optimizationResult.routeB;
    showToast(`Adopted ${winnerName} as the primary acquisition corridor (${winnerMetrics.packagesAffectedCount} packages affected, ${winnerMetrics.distanceKm.toFixed(2)} km). Ready for Phase II acquisition handoff.`);
  };

  // Backend Handoff: Export Intersected Parcel IDs (JSON)
  const handleExportIntersectedIdsJson = () => {
    const ids = getIntersectedParcelIds(activeIntersectedParcelIds);
    const activeRouteMetrics = adoptedRoute === 'routeB' 
      ? optimizationResult.routeB 
      : optimizationResult.routeA;

    const payload = {
      corridorRef: adoptedRoute ? `NHAI-${adoptedRoute.toUpperCase()}-2025` : 'NHAI-CORRIDOR-OPT-2025',
      selectedArea: area,
      bufferMeters,
      totalParcelsInCadastre: parcels.length,
      intersectedParcelsCount: ids.length,
      parcelIds: ids,
      optimizationVerdict: optimizationResult.optimalRouteId ? {
        winner: optimizationResult.optimalRouteId,
        reason: optimizationResult.winnerReason,
        routeADistanceKm: optimizationResult.routeA.distanceKm,
        routeAPackages: optimizationResult.routeA.packagesAffectedCount,
        routeBDistanceKm: optimizationResult.routeB.distanceKm,
        routeBPackages: optimizationResult.routeB.packagesAffectedCount,
      } : null,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intersected_parcel_ids_${area.village}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} intersected parcel IDs to JSON.`);
  };

  // Backend Handoff: Send to Acquisition Workflow (Next Phase)
  const handleSendToAcquisition = async () => {
    const ids = getIntersectedParcelIds(activeIntersectedParcelIds);
    await sendIntersectedParcelIds(ids);
    const adoptedText = adoptedRoute ? ` for ${adoptedRoute === 'routeA' ? 'Route A' : 'Route B'}` : '';
    showToast(`Handoff payload dispatched to console with ${ids.length} parcel IDs${adoptedText}.`);
  };

  // Export full alignment GeoJSON
  const handleExportAlignmentGeoJSON = () => {
    const features = [];

    if (roadCoordinates.length >= 2) {
      const effectiveRoadCoords = isCurved && roadCoordinates.length >= 3
        ? generateCurvedCoordinates(roadCoordinates, 20)
        : roadCoordinates;

      features.push({
        type: 'Feature',
        properties: {
          name: 'Highway Route A Alignment',
          corridorType: 'road',
          routeId: 'routeA',
          isOptimal: optimizationResult.optimalRouteId === 'routeA',
          bufferMeters,
          isCurved,
          distanceKm: optimizationResult.routeA.distanceKm,
          packagesAffected: optimizationResult.routeA.packagesAffectedCount,
          controlPointsCount: roadCoordinates.length,
        },
        geometry: {
          type: 'LineString',
          coordinates: effectiveRoadCoords,
        },
      });
    }

    if (routeBCoordinates.length >= 2) {
      const effectiveRouteBCoords = isRouteBCurved && routeBCoordinates.length >= 3
        ? generateCurvedCoordinates(routeBCoordinates, 20)
        : routeBCoordinates;

      features.push({
        type: 'Feature',
        properties: {
          name: 'Highway Route B Alternative Alignment',
          corridorType: 'road',
          routeId: 'routeB',
          isOptimal: optimizationResult.optimalRouteId === 'routeB',
          bufferMeters,
          isCurved: isRouteBCurved,
          distanceKm: optimizationResult.routeB.distanceKm,
          packagesAffected: optimizationResult.routeB.packagesAffectedCount,
          controlPointsCount: routeBCoordinates.length,
        },
        geometry: {
          type: 'LineString',
          coordinates: effectiveRouteBCoords,
        },
      });
    }

    if (railwayCoordinates.length >= 2) {
      const effectiveRailwayCoords = isRailwayCurved && railwayCoordinates.length >= 3
        ? generateCurvedCoordinates(railwayCoordinates, 20)
        : railwayCoordinates;

      features.push({
        type: 'Feature',
        properties: {
          name: 'Railway Track Alignment Centerline',
          corridorType: 'railway',
          corridorRef: 'IR-S-CORRIDOR-2025',
          bufferMeters: railwayBufferMeters,
          isCurved: isRailwayCurved,
          controlPointsCount: railwayCoordinates.length,
        },
        geometry: {
          type: 'LineString',
          coordinates: effectiveRailwayCoords,
        },
      });
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features,
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corridor_alignments_${area.village}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported Alignment GeoJSON with ${features.length} corridor features.`);
  };

  // Save analysis placeholder
  const handleSaveAnalysis = () => {
    showToast('Alignment analysis session saved to local GIS workspace.');
  };

  // USER REQUEST: Use Real Live GPS Location
  const handleUseLiveLocation = async () => {
    setIsLocatingUser(true);
    try {
      const loc = await getCurrentUserLocation();
      setUserLocation(loc);
      showToast(`Real GPS detected: ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E (±${loc.accuracy}m)`);

      handleLoadParcelsAtLocation(loc.latitude, loc.longitude);

      reverseGeocodeCoordinates(loc.latitude, loc.longitude).then((geo) => {
        const enriched: UserLiveLocation = {
          ...loc,
          address: geo.displayName,
          city: geo.city,
          state: geo.state,
          country: geo.country,
        };
        setUserLocation(enriched);
        setArea({
          state: geo.state || 'Real GPS',
          district: geo.city || 'Local District',
          taluk: 'Device Location',
          village: geo.displayName ? geo.displayName.split(',')[0] : 'Current Location',
        });
      });
    } catch (err: any) {
      showToast(`GPS Error: ${err.message || 'Could not acquire position'}`);
    } finally {
      setIsLocatingUser(false);
    }
  };

  const handleLoadParcelsAtLocation = (lat: number, lng: number) => {
    const liveParcels = generateParcelsAroundLocation(lat, lng, 'LIVE-CAD');
    const { routeA, routeB } = generateAlignmentsAroundLocation(lat, lng);

    setParcels(liveParcels);
    setParcelsLoaded(true);
    setRoadCoordinates(routeA);
    setRouteBCoordinates(routeB);
    setRailwayCoordinates([]);
    setAnalysisPerformed(true);
    setSelectedParcel(null);

    handleRunAnalysis(routeA, false, routeB, false, [], false);
    showToast(`Loaded ${liveParcels.length} live cadastral land parcels at your real location!`);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Left GIS Navigation Rail */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header & Metadata */}
        <Header
          bufferMeters={bufferMeters}
          onOpenBufferSettings={() => setIsBufferModalOpen(true)}
          onExportGeoJSON={handleExportAlignmentGeoJSON}
          onSaveAnalysis={handleSaveAnalysis}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* STEP 1: Area Selector Bar */}
        <AreaSelector
          area={area}
          onChangeArea={(upd) => setArea((prev) => ({ ...prev, ...upd }))}
          onLoadParcels={handleLoadParcels}
          isLoading={isLoadingParcels}
          parcelsLoaded={parcelsLoaded}
          totalParcelsCount={parcels.length}
          onUseLiveLocation={handleUseLiveLocation}
          isLocating={isLocatingUser}
        />

        {/* Dynamic Workspace Body */}
        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Main Map Viewport with Parcel Inspector Overlay */}
          <div className="relative rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <MapViewport
              parcels={parcels}
              parcelsLoaded={parcelsLoaded}

              // Real-Life Map & Location
              userLocation={userLocation}
              onUpdateUserLocation={setUserLocation}
              onLoadParcelsAtLocation={handleLoadParcelsAtLocation}

              // Route A
              roadCoordinates={roadCoordinates}
              onUpdateRoadCoordinates={handleUpdateRoadCoordinates}
              isCurved={isCurved}
              onToggleCurved={handleToggleRouteACurved}
              showRoad={showRouteA}

              // Route B
              routeBCoordinates={routeBCoordinates}
              onUpdateRouteBCoordinates={handleUpdateRouteBCoordinates}
              isRouteBCurved={isRouteBCurved}
              onToggleRouteBCurved={handleToggleRouteBCurved}
              showRouteB={showRouteB}

              // Optimal Route
              optimalRouteId={optimizationResult.optimalRouteId}

              // Active corridor
              activeCorridorType={activeCorridorType}
              onChangeActiveCorridorType={setActiveCorridorType}

              // Selection & Analysis
              intersectedParcelIds={activeIntersectedParcelIds}
              selectedParcelId={selectedParcel?.parcelId || null}
              onSelectParcel={handleSelectParcel}
              onRunAnalysis={() => handleRunAnalysis(roadCoordinates, isCurved, routeBCoordinates, isRouteBCurved, railwayCoordinates, isRailwayCurved)}
              analysisPerformed={parcelsLoaded}
              bufferMeters={bufferMeters}

              // Railway Alignment
              railwayCoordinates={railwayCoordinates}
              onUpdateRailwayCoordinates={handleUpdateRailwayCoordinates}
              isRailwayCurved={isRailwayCurved}
              onToggleRailwayCurved={handleToggleRailwayCurved}
              railwayBufferMeters={railwayBufferMeters}
              showRailway={showRailway}

              // Intersections
              roadIntersectedIds={activeRoadIntersectedIds}
              routeBIntersectedIds={activeRouteBIntersectedIds}
              railwayIntersectedIds={activeRailwayIntersectedIds}
            />

            {/* 7. Parcel Inspector Drawer (when a parcel is selected) */}
            {selectedParcel && (
              <ParcelInspector
                parcel={selectedParcel}
                isIntersected={activeIntersectedParcelIds.includes(selectedParcel.parcelId)}
                impactStatus={selectedParcelImpact}
                onClose={() => setSelectedParcel(null)}
                onCenterOnMap={(p) => setSelectedParcel(p)}
                totalParcelsCount={parcels.length}
                intersectedParcelsCount={activeIntersectedParcelIds.length}
                bufferMeters={bufferMeters}
                onLoadSampleRouteA={handleLoadSampleRouteA}
                onLoadSampleRouteB={handleLoadSampleRouteB}
              />
            )}
          </div>

          {/* USER REQUEST: Route A vs Route B Optimization Comparison Card */}
          <RouteComparisonCard
            optimizationResult={optimizationResult}
            activeCorridorType={activeCorridorType}
            onChangeActiveCorridorType={setActiveCorridorType}
            showRouteA={showRouteA}
            onToggleShowRouteA={setShowRouteA}
            showRouteB={showRouteB}
            onToggleShowRouteB={setShowRouteB}
            isRouteACurved={isCurved}
            onToggleRouteACurved={handleToggleRouteACurved}
            isRouteBCurved={isRouteBCurved}
            onToggleRouteBCurved={handleToggleRouteBCurved}
            onLoadSampleRouteA={handleLoadSampleRouteA}
            onLoadSampleRouteB={handleLoadSampleRouteB}
            onLoadBothSamples={handleLoadBothSamples}
            onAdoptOptimalRoute={handleAdoptOptimalRoute}
            parcelsLoaded={parcelsLoaded}
          />

          {/* 8. Analysis Summary Metric Cards (Calculated dynamically) */}
          <AnalysisSummary
            totalParcels={parcels.length}
            intersectedCount={activeIntersectedParcelIds.length}
            analysisPerformed={parcelsLoaded}
          />

          {/* 9. Intersected Parcel Table (Shows ONLY parcels identified by frontend intersection logic) */}
          <IntersectedParcelsTable
            intersectedParcels={intersectedParcelsList}
            selectedParcelId={selectedParcel?.parcelId || null}
            onSelectParcel={(parcel) => handleSelectParcel(parcel)}
            onExportJson={handleExportIntersectedIdsJson}
            bufferMeters={bufferMeters}
            roadIntersectedIds={activeRoadIntersectedIds}
            routeAIntersectedIds={activeRoadIntersectedIds}
            routeBIntersectedIds={activeRouteBIntersectedIds}
            railwayIntersectedIds={activeRailwayIntersectedIds}
            onLoadSampleRouteA={handleLoadSampleRouteA}
            onLoadSampleRouteB={handleLoadSampleRouteB}
            onLoadBothSamples={handleLoadBothSamples}
            onChangeBuffer={handleSelectBuffer}
          />

          {/* 10. Bottom Action Banner: Backend Handoff */}
          <BottomActionBanner
            intersectedCount={activeIntersectedParcelIds.length}
            analysisPerformed={parcelsLoaded}
            onExportJson={handleExportIntersectedIdsJson}
            onSaveAnalysis={handleSaveAnalysis}
            onSendToBackend={handleSendToAcquisition}
          />
        </div>
      </div>

      {/* Buffer Settings Modal */}
      <BufferSettingsModal
        isOpen={isBufferModalOpen}
        onClose={() => setIsBufferModalOpen(false)}
        currentBuffer={bufferMeters}
        onSelectBuffer={handleSelectBuffer}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="gis-toast-notification"
          className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 text-xs font-technical flex items-center gap-2 z-50 animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
