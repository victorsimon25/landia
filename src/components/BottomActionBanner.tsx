/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  FileCode, 
  Save, 
  ArrowRight, 
  Loader2,
  Check
} from 'lucide-react';

interface BottomActionBannerProps {
  intersectedCount: number;
  analysisPerformed: boolean;
  onExportJson: () => void;
  onSaveAnalysis: () => void;
  onSendToBackend: () => Promise<void>;
}

export const BottomActionBanner: React.FC<BottomActionBannerProps> = ({
  intersectedCount,
  analysisPerformed,
  onExportJson,
  onSaveAnalysis,
  onSendToBackend,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    setSentSuccess(false);
    try {
      await onSendToBackend();
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  if (!analysisPerformed) {
    return null;
  }

  return (
    <div 
      id="gis-bottom-action-banner"
      className="bg-[#0B192C] text-white p-5 rounded-lg border border-[#1E3E62] shadow-xl flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#0284C7]/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight text-white font-technical uppercase">
            Spatial Intersection Analysis Complete
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-technical">
            <strong>{intersectedCount}</strong> parcel IDs identified touching the proposed road alignment corridor.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          id="banner-export-json-btn"
          onClick={onExportJson}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E3E62]/80 hover:bg-[#1E3E62] text-white rounded text-xs font-semibold font-technical transition-colors border border-slate-600/50"
        >
          <FileCode className="w-3.5 h-3.5 text-sky-400" />
          <span>Export Intersected Parcel IDs (JSON)</span>
        </button>

        <button
          id="banner-save-btn"
          onClick={onSaveAnalysis}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E3E62]/80 hover:bg-[#1E3E62] text-white rounded text-xs font-semibold font-technical transition-colors border border-slate-600/50"
        >
          <Save className="w-3.5 h-3.5 text-slate-300" />
          <span>Save Alignment Analysis</span>
        </button>

        <button
          id="banner-handoff-btn"
          disabled={isSending || intersectedCount === 0}
          onClick={handleSend}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-bold font-technical shadow-lg transition-all ${
            sentSuccess
              ? 'bg-emerald-600 text-white'
              : isSending
              ? 'bg-sky-700 text-white cursor-wait'
              : 'bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#004e77] text-white'
          }`}
        >
          {sentSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Handoff Dispatched to Console</span>
            </>
          ) : isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Packaging Payload...</span>
            </>
          ) : (
            <>
              <span>Send Parcel IDs to Acquisition Workflow (Next Phase)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
