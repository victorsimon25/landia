/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ChevronRight, 
  Search, 
  Bell, 
  Route, 
  Sliders, 
  Save, 
  FileCode,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onExportGeoJSON?: () => void;
  onSaveAnalysis?: () => void;
  onOpenBufferSettings?: () => void;
  bufferMeters?: number;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportGeoJSON,
  onSaveAnalysis,
  onOpenBufferSettings,
  bufferMeters = 45,
  searchQuery = '',
  onSearchChange,
}) => {
  return (
    <header id="gis-header" className="bg-white border-b border-slate-200">
      {/* Top Utility Bar */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-100">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[12px] font-technical text-slate-500 uppercase tracking-wide">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">GIS WORKSPACE</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer transition-colors">ALIGNMENT PLANNING</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sky-700 font-semibold">PRE-ACQUISITION INTERSECTION</span>
        </div>

        {/* Search, Notifications & User */}
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="global-cadastre-search"
              type="text"
              placeholder="Search Parcel ID, Cadastre Sheet..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 rounded border border-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <button 
            id="notification-bell-btn"
            className="relative p-2 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600"></span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs border border-slate-300 shadow-xs">
              <span className="text-[11px] tracking-tight">RS</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[13px] font-semibold text-slate-800 leading-tight">R. K. Sharma</div>
              <div className="text-[11px] text-slate-500 leading-tight">GIS Systems Analyst</div>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Specification & Action Bar */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Chennai – Bangalore Highway Alignment
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-technical bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>
              PRE-ACQUISITION GIS PHASE
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-[12px] text-slate-600 font-technical flex-wrap">
            <span>Corridor Ref: <strong className="text-slate-800 font-semibold">NHAI-CB-ALIGN-2025-V4</strong></span>
            <span className="text-slate-300">•</span>
            <span>Centerline Length: <strong className="text-slate-800 font-semibold">14.2 km</strong></span>
            <span className="text-slate-300">•</span>
            <span>Proposed ROW Buffer: <strong className="text-slate-800 font-semibold">{bufferMeters}m</strong></span>
            <span className="text-slate-300">•</span>
            <span>CRS: <strong className="text-slate-800 font-semibold">EPSG:4326 (WGS 84 / UTM 44N)</strong></span>
          </div>
        </div>

        {/* Global GIS Tool Actions */}
        <div className="flex items-center gap-2.5">
          <button
            id="buffer-settings-btn"
            onClick={onOpenBufferSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Buffer Settings ({bufferMeters}m)</span>
          </button>

          <button
            id="save-analysis-btn"
            onClick={onSaveAnalysis}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Alignment Analysis</span>
          </button>

          <button
            id="export-geojson-btn"
            onClick={onExportGeoJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-600" />
            <span>Export Alignment (GeoJSON)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
