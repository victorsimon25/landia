/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Grid, Network, PieChart, Layers } from 'lucide-react';

interface AnalysisSummaryProps {
  totalParcels: number;
  intersectedCount: number;
  analysisPerformed: boolean;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  totalParcels,
  intersectedCount,
  analysisPerformed,
}) => {
  // Calculate dynamically from actual loaded parcel dataset
  const intersectionPercentage =
    totalParcels > 0 && analysisPerformed
      ? Number(((intersectedCount / totalParcels) * 100).toFixed(1))
      : 0;

  return (
    <div id="gis-analysis-summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. TOTAL PARCELS CARD */}
      <div 
        id="metric-total-parcels"
        className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between"
      >
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-technical">
            TOTAL PARCELS
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-1 font-technical tracking-tight">
            {totalParcels > 0 ? totalParcels.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-technical">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {totalParcels > 0
                ? 'Loaded from selected village cadastre'
                : 'Awaiting area selection'}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
          <Grid className="w-5 h-5" />
        </div>
      </div>

      {/* 2. INTERSECTED PARCELS CARD */}
      <div 
        id="metric-intersected-parcels"
        className={`bg-white p-5 rounded-lg border shadow-sm flex items-start justify-between ${
          analysisPerformed ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
        }`}
      >
        <div>
          <div className={`text-[11px] font-bold uppercase tracking-wider font-technical ${
            analysisPerformed ? 'text-amber-700' : 'text-slate-500'
          }`}>
            INTERSECTED PARCELS
          </div>
          <div className={`text-3xl font-bold mt-1 font-technical tracking-tight ${
            analysisPerformed ? 'text-amber-600' : 'text-slate-400'
          }`}>
            {analysisPerformed ? intersectedCount.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-technical">
            <span className={`w-2 h-2 rounded-full ${analysisPerformed ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
            <span>
              {analysisPerformed
                ? `(Touching proposed road) • Cadastral centerline buffer overlap`
                : 'Pending spatial intersection'}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
          analysisPerformed
            ? 'bg-amber-100 border-amber-200 text-amber-700'
            : 'bg-slate-100 border-slate-200 text-slate-400'
        }`}>
          <Network className="w-5 h-5" />
        </div>
      </div>

      {/* 3. INTERSECTION RATE CARD */}
      <div 
        id="metric-intersection-rate"
        className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between"
      >
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-technical">
            INTERSECTION RATE
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-1 font-technical tracking-tight">
            {analysisPerformed ? `${intersectionPercentage}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-technical">
            {analysisPerformed
              ? `Calculated: ${intersectedCount} / ${totalParcels} parcels`
              : 'Computed after alignment analysis'}
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
          <PieChart className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
