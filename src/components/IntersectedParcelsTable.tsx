/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileCode, 
  Download, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  X,
  AlertTriangle,
  Route,
  Train,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { CadastralParcel } from '../types';

interface IntersectedParcelsTableProps {
  intersectedParcels: CadastralParcel[];
  selectedParcelId: string | null;
  onSelectParcel: (parcel: CadastralParcel) => void;
  onExportJson: () => void;
  bufferMeters: number;
  roadIntersectedIds?: string[];
  railwayIntersectedIds?: string[];
  routeAIntersectedIds?: string[];
  routeBIntersectedIds?: string[];
  onLoadSampleRouteA?: () => void;
  onLoadSampleRouteB?: () => void;
  onLoadBothSamples?: () => void;
  onChangeBuffer?: (meters: number) => void;
}

export const IntersectedParcelsTable: React.FC<IntersectedParcelsTableProps> = ({
  intersectedParcels,
  selectedParcelId,
  onSelectParcel,
  onExportJson,
  bufferMeters,
  roadIntersectedIds = [],
  railwayIntersectedIds = [],
  routeAIntersectedIds = [],
  routeBIntersectedIds = [],
  onLoadSampleRouteA,
  onLoadSampleRouteB,
  onLoadBothSamples,
  onChangeBuffer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [corridorFilter, setCorridorFilter] = useState<'all' | 'routeA' | 'routeB' | 'both' | 'railway'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [coordsModalParcel, setCoordsModalParcel] = useState<CadastralParcel | null>(null);
  const pageSize = 6;

  // Resolve effective Route A IDs
  const effRouteAIds = routeAIntersectedIds.length > 0 ? routeAIntersectedIds : roadIntersectedIds;

  // Calculate corridor impact breakdown counts
  const counts = useMemo(() => {
    let countA = 0;
    let countB = 0;
    let countBoth = 0;
    let countRw = 0;

    intersectedParcels.forEach((p) => {
      const hitsA = effRouteAIds.includes(p.parcelId);
      const hitsB = routeBIntersectedIds.includes(p.parcelId);
      const hitsRw = railwayIntersectedIds.includes(p.parcelId);

      if (hitsA) countA++;
      if (hitsB) countB++;
      if (hitsA && hitsB) countBoth++;
      if (hitsRw) countRw++;
    });

    return {
      all: intersectedParcels.length,
      routeA: countA,
      routeB: countB,
      both: countBoth,
      railway: countRw,
    };
  }, [intersectedParcels, effRouteAIds, routeBIntersectedIds, railwayIntersectedIds]);

  // Filter parcels based on search query and corridor filter
  const filteredParcels = useMemo(() => {
    return intersectedParcels.filter((p) => {
      // Search matching
      const matchesSearch = p.parcelId.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const hitsA = effRouteAIds.includes(p.parcelId);
      const hitsB = routeBIntersectedIds.includes(p.parcelId);
      const hitsRw = railwayIntersectedIds.includes(p.parcelId);

      if (corridorFilter === 'routeA') return hitsA;
      if (corridorFilter === 'routeB') return hitsB;
      if (corridorFilter === 'both') return hitsA && hitsB;
      if (corridorFilter === 'railway') return hitsRw;
      return true;
    });
  }, [intersectedParcels, searchTerm, corridorFilter, effRouteAIds, routeBIntersectedIds, railwayIntersectedIds]);

  const totalPages = Math.max(1, Math.ceil(filteredParcels.length / pageSize));
  const displayedParcels = filteredParcels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper to compute centroid and approximate area
  const getParcelMetadata = (parcel: CadastralParcel) => {
    const coords = parcel.coordinates || [];
    if (coords.length === 0) {
      return { centroid: '0.0000, 0.0000', areaHectares: '0.45', areaSqm: '4,500', classification: 'Dryland (Agricultural)' };
    }

    let cx = 0;
    let cy = 0;
    coords.forEach(([lng, lat]) => {
      cx += lng;
      cy += lat;
    });
    cx /= coords.length;
    cy /= coords.length;

    // Deterministic area calculation based on coordinate bounds
    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const dLatM = (maxLat - minLat) * 111000;
    const dLngM = (maxLng - minLng) * 111000 * Math.cos((cy * Math.PI) / 180);
    const approxSqm = Math.max(1200, Math.round(dLatM * dLngM * 0.72));
    const approxHectares = (approxSqm / 10000).toFixed(2);

    // Classification mapping based on parcel ID
    const idNum = parseInt(parcel.parcelId.replace(/\D/g, ''), 10) || 1;
    let classification = 'Agricultural (Dryland)';
    if (idNum % 3 === 0) classification = 'Agricultural (Wetland)';
    else if (idNum % 5 === 0) classification = 'Gramanatham (Residential)';
    else if (idNum % 2 === 0) classification = 'Commercial Agro-Plot';

    return {
      centroid: `${cx.toFixed(4)}° E, ${cy.toFixed(4)}° N`,
      areaHectares: approxHectares,
      areaSqm: approxSqm.toLocaleString(),
      classification,
    };
  };

  const handleExportCsv = () => {
    if (intersectedParcels.length === 0) return;
    const header = 'Parcel ID,Impact Status,Corridors Intersected,Vertices Count,Centroid Coordinates\n';
    const rows = intersectedParcels
      .map((p) => {
        const hitsA = effRouteAIds.includes(p.parcelId);
        const hitsB = routeBIntersectedIds.includes(p.parcelId);
        const hitsRw = railwayIntersectedIds.includes(p.parcelId);
        const list: string[] = [];
        if (hitsA) list.push('Route A');
        if (hitsB) list.push('Route B');
        if (hitsRw) list.push('Railway');

        const meta = getParcelMetadata(p);
        return `"${p.parcelId}","AFFECTED","${list.join(' + ') || 'Right-of-Way'}",${p.coordinates.length},"${meta.centroid}"`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live_intersected_parcels_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="intersected-parcels-section"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* 1. Live Header Banner & Actions */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Live Intersected Land Parcels
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                  {intersectedParcels.length} Affected
                </span>
              </h2>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold font-technical bg-sky-50 text-sky-800 border border-sky-200">
              <Sparkles className="w-3 h-3 text-sky-600" />
              Live Spatial Sync ({bufferMeters}m Corridor)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cadastral intersection calculation. As you draw, bend, or switch routes, affected land parcels update automatically.
          </p>
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="parcel-table-search"
              type="text"
              placeholder="Search Parcel ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-600 font-technical"
            />
          </div>

          <button
            id="export-table-json-btn"
            onClick={onExportJson}
            disabled={intersectedParcels.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-medium rounded transition-colors font-technical shadow-2xs"
            title="Export affected parcel IDs for backend acquisition pipeline"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-600" />
            <span>Export JSON</span>
          </button>

          <button
            id="export-table-csv-btn"
            onClick={handleExportCsv}
            disabled={intersectedParcels.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-medium rounded transition-colors font-technical shadow-2xs"
            title="Export CSV spreadsheet for cadastral revenue records"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Corridor Filter Tabs */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 font-technical uppercase mr-1">
            Filter Corridor:
          </span>

          {/* All Affected */}
          <button
            id="filter-all-parcels-btn"
            onClick={() => { setCorridorFilter('all'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
              corridorFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Affected ({counts.all})
          </button>

          {/* Route A Only */}
          <button
            id="filter-route-a-parcels-btn"
            onClick={() => { setCorridorFilter('routeA'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
              corridorFilter === 'routeA'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Route A Highway ({counts.routeA})
          </button>

          {/* Route B Only */}
          <button
            id="filter-route-b-parcels-btn"
            onClick={() => { setCorridorFilter('routeB'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
              corridorFilter === 'routeB'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Route B Alternative ({counts.routeB})
          </button>

          {/* Overlapping A & B */}
          {counts.both > 0 && (
            <button
              id="filter-both-parcels-btn"
              onClick={() => { setCorridorFilter('both'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
                corridorFilter === 'both'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white text-cyan-800 hover:bg-cyan-50 border border-cyan-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Both Corridors ({counts.both})
            </button>
          )}

          {/* Railway */}
          {counts.railway > 0 && (
            <button
              id="filter-railway-parcels-btn"
              onClick={() => { setCorridorFilter('railway'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-technical transition-all ${
                corridorFilter === 'railway'
                  ? 'bg-indigo-800 text-white shadow-xs'
                  : 'bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              <Train className="w-3 h-3 text-indigo-400" />
              Railway ({counts.railway})
            </button>
          )}
        </div>

        <div className="text-[11px] font-technical text-slate-500">
          Showing {displayedParcels.length} of {filteredParcels.length} matching parcels
        </div>
      </div>

      {/* 3. Table Data View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-technical">
              <th className="py-3 px-5">Parcel ID & Status</th>
              <th className="py-3 px-5">Cadastral Classification</th>
              <th className="py-3 px-5">Corridor Intersection</th>
              <th className="py-3 px-5">Centroid & Area</th>
              <th className="py-3 px-5 text-right">Map Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-technical">
            {intersectedParcels.length === 0 ? (
              /* EMPTY STATE WITH QUICK PRESET LOADERS */
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center bg-slate-50/40">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-technical uppercase">
                        No Parcels Currently Intersected
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        The current alignment does not overlap any land parcels with the active {bufferMeters}m buffer. Load sample alignments or draw road lines across the village cadastre to see live intersections.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {onLoadSampleRouteA && (
                        <button
                          id="empty-load-route-a-btn"
                          onClick={onLoadSampleRouteA}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-semibold transition-all shadow-xs"
                        >
                          <Route className="w-3.5 h-3.5" />
                          <span>Load Route A (5 Parcels)</span>
                        </button>
                      )}

                      {onLoadSampleRouteB && (
                        <button
                          id="empty-load-route-b-btn"
                          onClick={onLoadSampleRouteB}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-semibold transition-all shadow-xs"
                        >
                          <Route className="w-3.5 h-3.5" />
                          <span>Load Route B (3 Parcels)</span>
                        </button>
                      )}

                      {onLoadBothSamples && (
                        <button
                          id="empty-load-both-btn"
                          onClick={onLoadBothSamples}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-all shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Load Both Alignments</span>
                        </button>
                      )}

                      {onChangeBuffer && bufferMeters < 60 && (
                        <button
                          id="empty-expand-buffer-btn"
                          onClick={() => onChangeBuffer(60)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-all shadow-2xs"
                        >
                          <span>Expand Buffer to 60m</span>
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : displayedParcels.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No parcel IDs match the search filter &quot;{searchTerm}&quot; in the {corridorFilter} category.
                </td>
              </tr>
            ) : (
              displayedParcels.map((parcel) => {
                const isSelected = selectedParcelId === parcel.parcelId;
                const meta = getParcelMetadata(parcel);
                const hitsA = effRouteAIds.includes(parcel.parcelId);
                const hitsB = routeBIntersectedIds.includes(parcel.parcelId);
                const hitsRw = railwayIntersectedIds.includes(parcel.parcelId);

                return (
                  <tr
                    key={parcel.parcelId}
                    id={`parcel-row-${parcel.parcelId}`}
                    onClick={() => onSelectParcel(parcel)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-sky-50/80 border-l-4 border-l-[#0284C7]' 
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* 1. Parcel ID & Status */}
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-500 animate-ping' : 'bg-rose-500'}`} />
                        <span className="text-sm font-bold tracking-tight text-slate-900">
                          {parcel.parcelId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          ⚠️ AFFECTED
                        </span>
                      </div>
                    </td>

                    {/* 2. Cadastral Classification */}
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800 font-medium">{meta.classification}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {parcel.coordinates.length} Boundary Vertices
                      </div>
                    </td>

                    {/* 3. Corridor Intersection Tags */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hitsA && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide font-technical bg-sky-100 text-sky-800 border border-sky-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            Route A Highway
                          </span>
                        )}

                        {hitsB && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide font-technical bg-purple-100 text-purple-800 border border-purple-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Route B Alternative
                          </span>
                        )}

                        {hitsRw && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide font-technical bg-indigo-100 text-indigo-800 border border-indigo-300">
                            <Train className="w-3 h-3 text-indigo-500" />
                            Railway Line
                          </span>
                        )}

                        {hitsA && hitsB && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-300">
                            DUAL IMPACT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Centroid & Area */}
                    <td className="py-3.5 px-5 text-slate-600">
                      <div className="text-slate-800 font-semibold">{meta.areaHectares} Ha ({meta.areaSqm} m²)</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <span>{meta.centroid}</span>
                        <button
                          id={`view-coords-btn-${parcel.parcelId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoordsModalParcel(parcel);
                          }}
                          className="text-sky-700 hover:text-sky-900 underline font-medium cursor-pointer"
                          title="View GeoJSON coordinates"
                        >
                          GeoJSON
                        </button>
                      </div>
                    </td>

                    {/* 5. Map Action */}
                    <td className="py-3.5 px-5 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 text-white text-xs font-bold rounded-lg font-technical shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />
                          <span>Active on Map</span>
                        </span>
                      ) : (
                        <button
                          id={`view-on-map-btn-${parcel.parcelId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectParcel(parcel);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition-colors font-technical shadow-2xs"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect on Map</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Table Footer & Pagination */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-technical text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            Live Spatial Cadastral Collection • Real-time intersection with {bufferMeters}m active buffer
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded text-[11px] font-medium transition-colors shadow-2xs"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded text-[11px] font-medium transition-colors shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>

      {/* 5. Coordinate Viewer Modal */}
      {coordsModalParcel && (
        <div 
          id="coordinates-modal-overlay"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-800 font-technical uppercase">
                  {coordsModalParcel.parcelId} — Boundary Polygon Coordinates (EPSG:4326)
                </h3>
              </div>
              <button
                onClick={() => setCoordsModalParcel(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono max-h-60 overflow-y-auto leading-relaxed">
                {JSON.stringify(
                  {
                    type: 'Feature',
                    properties: {
                      parcelId: coordsModalParcel.parcelId,
                      ...getParcelMetadata(coordsModalParcel),
                      status: 'AFFECTED_BY_RIGHT_OF_WAY',
                    },
                    geometry: {
                      type: 'Polygon',
                      coordinates: [coordsModalParcel.coordinates],
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setCoordsModalParcel(null)}
                className="px-4 py-1.5 bg-[#006194] hover:bg-[#004e77] text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
