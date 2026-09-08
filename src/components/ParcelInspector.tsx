/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  MapPin, 
  Download, 
  FileCode, 
  Check, 
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { CadastralParcel, ParcelImpactStatus } from '../types';

interface ParcelInspectorProps {
  parcel: CadastralParcel | null;
  isIntersected: boolean;
  impactStatus?: ParcelImpactStatus | null;
  onClose: () => void;
  onCenterOnMap: (parcel: CadastralParcel) => void;
  totalParcelsCount: number;
  intersectedParcelsCount: number;
  bufferMeters?: number;
  onLoadSampleRouteA?: () => void;
  onLoadSampleRouteB?: () => void;
}

export const ParcelInspector: React.FC<ParcelInspectorProps> = ({
  parcel,
  isIntersected,
  impactStatus,
  onClose,
  onCenterOnMap,
  totalParcelsCount,
  intersectedParcelsCount,
  bufferMeters = 45,
  onLoadSampleRouteA,
  onLoadSampleRouteB,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedCoords, setExpandedCoords] = useState(false);

  if (!parcel) return null;

  const vertexCount = parcel.coordinates.length;
  const nonIntersectedCount = Math.max(0, totalParcelsCount - intersectedParcelsCount);

  // Derive definitive impact state
  const affected = impactStatus ? impactStatus.isAffected : isIntersected;
  const hasCorridors = impactStatus ? impactStatus.hasCorridors : true;
  const hitsRouteA = impactStatus?.hitsRouteA ?? false;
  const hitsRouteB = impactStatus?.hitsRouteB ?? false;
  const hitsRailway = impactStatus?.hitsRailway ?? false;

  // Centroid coordinate display
  let cx = 0;
  let cy = 0;
  if (parcel.coordinates.length > 0) {
    parcel.coordinates.forEach(([lng, lat]) => {
      cx += lng;
      cy += lat;
    });
    cx /= parcel.coordinates.length;
    cy /= parcel.coordinates.length;
  }

  // GeoJSON Polygon structure
  const geoJsonData = {
    type: 'Polygon',
    crs: 'EPSG:4326',
    coordinates: [parcel.coordinates],
  };

  const geoJsonString = JSON.stringify(geoJsonData, null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText(geoJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportGeometry = () => {
    const feature = {
      type: 'Feature',
      properties: {
        parcelId: parcel.parcelId,
        isAffected: affected,
        intersectionStatus: affected ? 'AFFECTED' : 'NOT AFFECTED',
        hitsRouteA,
        hitsRouteB,
        hitsRailway,
        bufferMeters,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [parcel.coordinates],
      },
    };

    const blob = new Blob([JSON.stringify(feature, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${parcel.parcelId}_cadastral_geometry.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="parcel-inspector-drawer"
      className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 transition-all text-slate-800 animate-fade-in"
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        affected 
          ? 'bg-rose-50/80 border-rose-200' 
          : hasCorridors 
          ? 'bg-emerald-50/80 border-emerald-200' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            affected 
              ? 'bg-rose-500 animate-pulse' 
              : hasCorridors 
              ? 'bg-emerald-500' 
              : 'bg-sky-500'
          }`}></span>
          <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase font-technical">
            PARCEL {parcel.parcelId}
          </h2>
          <span className="text-[10px] text-slate-500 font-technical">
            ({vertexCount} pts)
          </span>
        </div>
        <button
          id="close-parcel-inspector-btn"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white/80 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto text-xs">
        
        {/* ============================================================== */}
        {/* HERO IMPACT STATUS CARD: AFFECTED VS NOT AFFECTED              */}
        {/* ============================================================== */}
        {affected ? (
          <div 
            id="parcel-affected-hero-alert"
            className="rounded-lg border-2 border-rose-400 bg-rose-50/95 p-3.5 space-y-2.5 shadow-sm"
          >
            {/* Top Status Title Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs font-technical tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600 fill-rose-100 flex-shrink-0" />
                <span>AFFECTED BY CORRIDOR</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-technical bg-rose-600 text-white tracking-wider">
                ACQUISITION REQUIRED
              </span>
            </div>

            {/* Impact Explanation */}
            <p className="text-[11px] text-rose-900 leading-relaxed font-technical">
              {impactStatus?.detailMessage || `Parcel ${parcel.parcelId} intersects the planned corridor Right-of-Way buffer. It falls within the land acquisition zone.`}
            </p>

            {/* Corridor-by-Corridor Breakdown */}
            <div className="space-y-1.5 pt-1 border-t border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-technical">
                Corridor Impact Breakdown:
              </span>

              {/* Route A Status */}
              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-rose-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Highway Route A (45m ROW)
                </span>
                {hitsRouteA ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    ⚠️ INTERSECTED
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">
                    ✓ Outside Buffer
                  </span>
                )}
              </div>

              {/* Route B Status */}
              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-rose-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Highway Route B (45m ROW)
                </span>
                {hitsRouteB ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ⚠️ INTERSECTED
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">
                    ✓ Outside Buffer
                  </span>
                )}
              </div>

              {/* Railway Status */}
              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-rose-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Railway Corridor (30m ROW)
                </span>
                {hitsRailway ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    ⚠️ INTERSECTED
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">
                    ✓ Outside Buffer
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : hasCorridors ? (
          <div 
            id="parcel-not-affected-hero-alert"
            className="rounded-lg border-2 border-emerald-400 bg-emerald-50/95 p-3.5 space-y-2.5 shadow-sm"
          >
            {/* Top Status Title Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs font-technical tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 flex-shrink-0" />
                <span>NOT AFFECTED (CLEAR)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-technical bg-emerald-600 text-white tracking-wider">
                UNENCUMBERED
              </span>
            </div>

            {/* Impact Explanation */}
            <p className="text-[11px] text-emerald-900 leading-relaxed font-technical">
              Parcel {parcel.parcelId} is safely outside all active corridor Right-of-Way envelopes. No land acquisition or compensation required.
            </p>

            {/* Corridor Clearance Checklist */}
            <div className="space-y-1.5 pt-1 border-t border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-technical">
                Corridor Clearance Verification:
              </span>

              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-emerald-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Highway Route A (45m ROW)
                </span>
                <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  SAFE / CLEAR
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-emerald-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Highway Route B (45m ROW)
                </span>
                <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  SAFE / CLEAR
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-white/70 rounded border border-emerald-100 font-technical text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Railway Corridor (30m ROW)
                </span>
                <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  SAFE / CLEAR
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            id="parcel-unassessed-hero-alert"
            className="rounded-lg border border-slate-300 bg-slate-50 p-3.5 space-y-2.5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs font-technical">
              <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>UNASSESSED — NO CORRIDORS DRAWN</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-technical">
              No highway or railway corridor alignments have been drawn yet. Draw an alignment on the map or load sample routes to evaluate whether this parcel is affected.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {onLoadSampleRouteA && (
                <button
                  onClick={onLoadSampleRouteA}
                  className="px-2.5 py-1 text-[10px] font-bold font-technical bg-sky-100 hover:bg-sky-200 text-sky-800 rounded border border-sky-300 transition-colors"
                >
                  Load Route A
                </button>
              )}
              {onLoadSampleRouteB && (
                <button
                  onClick={onLoadSampleRouteB}
                  className="px-2.5 py-1 text-[10px] font-bold font-technical bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded border border-emerald-300 transition-colors"
                >
                  Load Route B
                </button>
              )}
            </div>
          </div>
        )}

        {/* Essential Properties Table */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500 font-technical uppercase text-[11px]">Parcel Identifier</span>
            <span className="font-bold text-slate-900 text-sm font-technical">{parcel.parcelId}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500 font-technical uppercase text-[11px]">Status</span>
            <span className={`font-bold font-technical ${affected ? 'text-rose-600' : 'text-emerald-600'}`}>
              • {affected ? 'AFFECTED (Acquisition Required)' : 'NOT AFFECTED (Safe)'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500 font-technical uppercase text-[11px]">Centroid Coordinates</span>
            <span className="font-mono text-slate-700 text-[10px]">
              {cx.toFixed(5)}°E, {cy.toFixed(5)}°N
            </span>
          </div>

          {/* Coordinate Viewer */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-500 font-technical uppercase text-[11px]">
                Boundary Polygon ({vertexCount} vertices)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-sky-700 hover:text-sky-900 flex items-center gap-1 font-technical"
                  title="Copy GeoJSON"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setExpandedCoords(!expandedCoords)}
                  className="text-[11px] text-sky-700 hover:text-sky-900 flex items-center gap-0.5 font-technical font-medium"
                >
                  <FileCode className="w-3 h-3" />
                  <span>GeoJSON</span>
                  {expandedCoords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {expandedCoords && (
              <pre className="p-2.5 bg-slate-900 text-slate-200 rounded text-[10px] font-mono leading-relaxed overflow-x-auto max-h-36 border border-slate-800">
                {geoJsonString}
              </pre>
            )}
          </div>
        </div>

        {/* Village Cadastral Summary Breakdown */}
        <div className="space-y-2 pt-1 border-t border-slate-100 pb-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-technical">
              VILLAGE CADASTRAL OVERVIEW
            </span>
            <span className="text-[11px] font-technical font-semibold text-slate-700">
              {totalParcelsCount.toLocaleString()} Total Parcels
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Visual Indicator Ring */}
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-slate-200"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-rose-500"
                  strokeWidth="4"
                  strokeDasharray={`${totalParcelsCount > 0 ? (intersectedParcelsCount / totalParcelsCount) * 88 : 0}, 88`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-technical text-slate-700">
                {totalParcelsCount > 0 ? Math.round((intersectedParcelsCount / totalParcelsCount) * 100) : 0}%
              </div>
            </div>

            <div className="flex-1 space-y-1 text-[11px] font-technical">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Affected Parcels
                </span>
                <strong className="text-slate-900 font-semibold">{intersectedParcelsCount.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Safe / Clear Parcels
                </span>
                <strong className="text-slate-900 font-semibold">{nonIntersectedCount.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            id="center-on-map-btn"
            onClick={() => onCenterOnMap(parcel)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#006194] hover:bg-[#004e77] text-white rounded font-medium text-xs shadow-sm transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Center on Map</span>
          </button>

          <button
            id="export-parcel-geometry-btn"
            onClick={handleExportGeometry}
            className="w-full flex items-center justify-center gap-2 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded font-medium text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Geometry (GeoJSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
