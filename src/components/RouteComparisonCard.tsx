/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Trophy, 
  Route, 
  Ruler, 
  Layers, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRightLeft, 
  Sparkles,
  Pencil,
  Spline,
  Eye,
  EyeOff,
  Scale
} from 'lucide-react';
import { RouteOptimizationResult, ActiveCorridorType, RoadRouteId } from '../types';

interface RouteComparisonCardProps {
  optimizationResult: RouteOptimizationResult;
  activeCorridorType: ActiveCorridorType;
  onChangeActiveCorridorType: (type: ActiveCorridorType) => void;
  showRouteA: boolean;
  onToggleShowRouteA: (show: boolean) => void;
  showRouteB: boolean;
  onToggleShowRouteB: (show: boolean) => void;
  isRouteACurved: boolean;
  onToggleRouteACurved: (curved: boolean) => void;
  isRouteBCurved: boolean;
  onToggleRouteBCurved: (curved: boolean) => void;
  onLoadSampleRouteA: () => void;
  onLoadSampleRouteB: () => void;
  onLoadBothSamples: () => void;
  onAdoptOptimalRoute: (routeId: RoadRouteId) => void;
  parcelsLoaded: boolean;
}

export const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({
  optimizationResult,
  activeCorridorType,
  onChangeActiveCorridorType,
  showRouteA,
  onToggleShowRouteA,
  showRouteB,
  onToggleShowRouteB,
  isRouteACurved,
  onToggleRouteACurved,
  isRouteBCurved,
  onToggleRouteBCurved,
  onLoadSampleRouteA,
  onLoadSampleRouteB,
  onLoadBothSamples,
  onAdoptOptimalRoute,
  parcelsLoaded,
}) => {
  const { routeA, routeB, optimalRouteId, winnerReason, packagesDifference, distanceDifferenceKm } = optimizationResult;

  const hasBothRoutes = routeA.coordinates.length >= 2 && routeB.coordinates.length >= 2;
  const isOptimalA = optimalRouteId === 'routeA';
  const isOptimalB = optimalRouteId === 'routeB';

  return (
    <div 
      id="route-optimization-comparison-card"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Route Optimization Engine</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-technical uppercase bg-sky-950 text-sky-300 border border-sky-800">
                Route A vs Route B
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-technical">
              Selects the optimal alignment based on packages affected (land parcels) &amp; construction distance
            </p>
          </div>
        </div>

        {/* Quick Sample Loader Tools */}
        {parcelsLoaded && (
          <div className="flex items-center gap-2">
            <button
              id="load-both-routes-preset-btn"
              onClick={onLoadBothSamples}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 transition-colors"
              title="Preload two sample road corridors for immediate comparative optimization"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Load Route A &amp; B Presets</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="p-5 space-y-4">
        {/* Route Selector & Drawing Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 font-technical uppercase tracking-wider">
              Active Drawing Target:
            </span>
            <div className="inline-flex rounded-lg p-1 bg-slate-200/80 border border-slate-300">
              <button
                id="select-drawing-route-a"
                onClick={() => onChangeActiveCorridorType('routeA')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold font-technical transition-all ${
                  activeCorridorType === 'routeA'
                    ? 'bg-[#0284C7] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>Route A {routeA.coordinates.length > 0 ? `(${routeA.coordinates.length} pts)` : ''}</span>
              </button>

              <button
                id="select-drawing-route-b"
                onClick={() => onChangeActiveCorridorType('routeB')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold font-technical transition-all ${
                  activeCorridorType === 'routeB'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>Route B {routeB.coordinates.length > 0 ? `(${routeB.coordinates.length} pts)` : ''}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-technical text-slate-500">
            <span>Tip: Draw both routes on the map to automatically trigger optimization comparison</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. ROUTE A CARD */}
          <div 
            id="card-route-a-metrics"
            className={`rounded-xl border p-4 transition-all relative ${
              isOptimalA 
                ? 'border-sky-400 bg-sky-50/40 ring-2 ring-sky-300/60 shadow-md' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {isOptimalA && (
              <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm border border-amber-300">
                <Trophy className="w-3 h-3 fill-slate-950" />
                <span>Selected Optimal</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#0284C7] flex items-center justify-center text-white text-[10px] font-bold">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Route A (Highway Primary)</h4>
                  <span className="text-[10px] font-technical text-slate-500">Centerline + 45m ROW Corridor</span>
                </div>
              </div>

              {/* Visibility & Curve Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleShowRouteA(!showRouteA)}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    showRouteA ? 'text-sky-700 bg-sky-100 hover:bg-sky-200' : 'text-slate-400 hover:text-slate-600 bg-slate-100'
                  }`}
                  title={showRouteA ? 'Hide Route A on map' : 'Show Route A on map'}
                >
                  {showRouteA ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {routeA.coordinates.length >= 2 && (
                  <button
                    onClick={() => onToggleRouteACurved(!isRouteACurved)}
                    className={`px-2 py-1 rounded text-[11px] font-technical font-medium flex items-center gap-1 border transition-colors ${
                      isRouteACurved 
                        ? 'bg-sky-100 text-sky-800 border-sky-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Toggle spline curves for Route A"
                  >
                    <Spline className="w-3 h-3 text-sky-600" />
                    <span>{isRouteACurved ? 'Curved' : 'Tangent'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-technical">
                  <Ruler className="w-3.5 h-3.5 text-sky-600" />
                  <span>DISTANCE</span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-technical mt-0.5">
                  {routeA.coordinates.length >= 2 ? `${routeA.distanceKm} km` : '—'}
                </div>
                <div className="text-[10px] text-slate-500 font-technical">
                  {routeA.coordinates.length >= 2 ? `${routeA.distanceMeters.toLocaleString()} meters` : 'Draw on map'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-technical">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>PACKAGES AFFECTED</span>
                </div>
                <div className={`text-xl font-bold font-technical mt-0.5 ${
                  routeA.packagesAffectedCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {routeA.coordinates.length >= 2 ? routeA.packagesAffectedCount : '—'}
                </div>
                <div className="text-[10px] text-slate-500 font-technical">
                  Land parcels intersected
                </div>
              </div>
            </div>

            {/* Sub-actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => onChangeActiveCorridorType('routeA')}
                className={`inline-flex items-center gap-1 font-technical font-medium ${
                  activeCorridorType === 'routeA' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Pencil className="w-3 h-3" />
                <span>{activeCorridorType === 'routeA' ? 'Editing Route A' : 'Switch to Edit Route A'}</span>
              </button>

              {routeA.coordinates.length === 0 && parcelsLoaded && (
                <button
                  onClick={onLoadSampleRouteA}
                  className="text-sky-600 hover:text-sky-700 underline text-xs font-technical"
                >
                  Load Sample Route A
                </button>
              )}
            </div>
          </div>

          {/* 2. ROUTE B CARD */}
          <div 
            id="card-route-b-metrics"
            className={`rounded-xl border p-4 transition-all relative ${
              isOptimalB 
                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300/60 shadow-md' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {isOptimalB && (
              <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-sm border border-emerald-400">
                <Trophy className="w-3 h-3 fill-white" />
                <span>Selected Optimal</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                  B
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Route B (Bypass Alternative)</h4>
                  <span className="text-[10px] font-technical text-slate-500">Centerline + 45m ROW Corridor</span>
                </div>
              </div>

              {/* Visibility & Curve Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleShowRouteB(!showRouteB)}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    showRouteB ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-400 hover:text-slate-600 bg-slate-100'
                  }`}
                  title={showRouteB ? 'Hide Route B on map' : 'Show Route B on map'}
                >
                  {showRouteB ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {routeB.coordinates.length >= 2 && (
                  <button
                    onClick={() => onToggleRouteBCurved(!isRouteBCurved)}
                    className={`px-2 py-1 rounded text-[11px] font-technical font-medium flex items-center gap-1 border transition-colors ${
                      isRouteBCurved 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Toggle spline curves for Route B"
                  >
                    <Spline className="w-3 h-3 text-emerald-600" />
                    <span>{isRouteBCurved ? 'Curved' : 'Tangent'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-technical">
                  <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DISTANCE</span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-technical mt-0.5">
                  {routeB.coordinates.length >= 2 ? `${routeB.distanceKm} km` : '—'}
                </div>
                <div className="text-[10px] text-slate-500 font-technical">
                  {routeB.coordinates.length >= 2 ? `${routeB.distanceMeters.toLocaleString()} meters` : 'Draw on map'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-technical">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>PACKAGES AFFECTED</span>
                </div>
                <div className={`text-xl font-bold font-technical mt-0.5 ${
                  routeB.packagesAffectedCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {routeB.coordinates.length >= 2 ? routeB.packagesAffectedCount : '—'}
                </div>
                <div className="text-[10px] text-slate-500 font-technical">
                  Land parcels intersected
                </div>
              </div>
            </div>

            {/* Sub-actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => onChangeActiveCorridorType('routeB')}
                className={`inline-flex items-center gap-1 font-technical font-medium ${
                  activeCorridorType === 'routeB' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Pencil className="w-3 h-3" />
                <span>{activeCorridorType === 'routeB' ? 'Editing Route B' : 'Switch to Edit Route B'}</span>
              </button>

              {routeB.coordinates.length === 0 && parcelsLoaded && (
                <button
                  onClick={onLoadSampleRouteB}
                  className="text-emerald-600 hover:text-emerald-700 underline text-xs font-technical"
                >
                  Load Sample Route B
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. OPTIMAL ROUTE DECISION BANNER */}
        <div 
          id="optimal-route-verdict-banner"
          className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
            hasBothRoutes
              ? optimalRouteId === 'routeB'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasBothRoutes
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-200 text-slate-500'
            }`}>
              <Trophy className="w-5 h-5 fill-amber-500" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-technical text-slate-500">
                  OPTIMIZATION DECISION
                </span>
                {hasBothRoutes && optimalRouteId && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-technical uppercase ${
                    optimalRouteId === 'routeB' ? 'bg-emerald-700 text-white' : 'bg-[#0284C7] text-white'
                  }`}>
                    {optimalRouteId === 'routeB' ? 'ROUTE B SELECTED' : 'ROUTE A SELECTED'}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold mt-1">
                {winnerReason}
              </p>

              {hasBothRoutes && (
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-technical">
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Package Delta: {packagesDifference > 0 
                        ? `Route B saves ${packagesDifference} packages` 
                        : packagesDifference < 0 
                        ? `Route A saves ${Math.abs(packagesDifference)} packages` 
                        : 'Identical package count'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <Ruler className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      Distance Delta: {distanceDifferenceKm > 0 
                        ? `Route B is ${Math.round(distanceDifferenceKm * 1000)}m shorter` 
                        : distanceDifferenceKm < 0 
                        ? `Route A is ${Math.round(Math.abs(distanceDifferenceKm) * 1000)}m shorter` 
                        : 'Identical route distance'}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Adopt Button */}
          {hasBothRoutes && optimalRouteId && (
            <button
              id="adopt-optimal-route-btn"
              onClick={() => onAdoptOptimalRoute(optimalRouteId)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-technical shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Adopt {optimalRouteId === 'routeB' ? 'Route B' : 'Route A'} as Primary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
