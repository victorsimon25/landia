/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, Database, Loader2, CheckCircle2, AlertCircle, LocateFixed } from 'lucide-react';
import { AreaSelection } from '../types';

interface AreaSelectorProps {
  area: AreaSelection;
  onChangeArea: (updated: Partial<AreaSelection>) => void;
  onLoadParcels: () => void;
  isLoading: boolean;
  parcelsLoaded: boolean;
  totalParcelsCount: number;
  onUseLiveLocation?: () => void;
  isLocating?: boolean;
}

export const AreaSelector: React.FC<AreaSelectorProps> = ({
  area,
  onChangeArea,
  onLoadParcels,
  isLoading,
  parcelsLoaded,
  totalParcelsCount,
  onUseLiveLocation,
  isLocating = false,
}) => {
  const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh'];
  const districts = ['Chengalpattu', 'Kanchipuram', 'Tiruvallur'];
  const taluks = ['Thiruporur', 'Chengalpattu', 'Vandalur'];
  const villages = ['Kariyampakkam', 'Alathur', 'Paiyanur', 'Siruseri'];

  return (
    <div id="area-selection-panel" className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Step Label */}
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-technical">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span>STEP 1 • SELECT PROJECT AREA</span>
        </div>

        {/* Dropdown Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* State */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-state" className="text-[11px] font-technical uppercase text-slate-500">
              State
            </label>
            <select
              id="select-state"
              value={area.state}
              onChange={(e) => onChangeArea({ state: e.target.value })}
              className="h-8 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-sky-600 cursor-pointer"
            >
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-district" className="text-[11px] font-technical uppercase text-slate-500">
              District
            </label>
            <select
              id="select-district"
              value={area.district}
              onChange={(e) => onChangeArea({ district: e.target.value })}
              className="h-8 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-sky-600 cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Taluk */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-taluk" className="text-[11px] font-technical uppercase text-slate-500">
              Taluk
            </label>
            <select
              id="select-taluk"
              value={area.taluk}
              onChange={(e) => onChangeArea({ taluk: e.target.value })}
              className="h-8 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-sky-600 cursor-pointer"
            >
              {taluks.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Village */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-village" className="text-[11px] font-technical uppercase text-slate-500">
              Village
            </label>
            <select
              id="select-village"
              value={area.village}
              onChange={(e) => onChangeArea({ village: e.target.value })}
              className="h-8 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-sky-600 cursor-pointer"
            >
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Load Land Parcels Button */}
          <button
            id="load-parcels-btn"
            onClick={onLoadParcels}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 h-8 text-xs font-semibold rounded text-white transition-all shadow-sm ${
              isLoading
                ? 'bg-sky-400 cursor-not-allowed'
                : 'bg-[#006194] hover:bg-[#004e77] active:bg-[#003d5d]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading Parcels...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Load Land Parcels</span>
              </>
            )}
          </button>

          {/* USER REQUEST: Real Live Location Button */}
          {onUseLiveLocation && (
            <button
              id="locate-real-pos-btn"
              onClick={onUseLiveLocation}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded transition-all border shadow-xs ${
                isLocating
                  ? 'bg-sky-100 text-sky-700 border-sky-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Detect your device GPS real location and load live map & cadastre"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : 'text-emerald-600'}`} />
              <span>{isLocating ? 'Locating...' : 'My Real GPS'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Area Status Banner Sub-strip */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-technical">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sky-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Connecting to Cadastral Spatial Service... Fetching boundary coordinates for {area.village} ({area.district}).</span>
          </div>
        ) : parcelsLoaded ? (
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Area Selected: <strong>{area.village} ({area.district})</strong> • Cadastral Boundaries Loaded ({totalParcelsCount} Parcels) • Ready for Road Alignment
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Map is currently blank of parcel data. Click &quot;Load Land Parcels&quot; to fetch geometry coordinates for {area.village}.</span>
          </div>
        )}
      </div>
    </div>
  );
};
