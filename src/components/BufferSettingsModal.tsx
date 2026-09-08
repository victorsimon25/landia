/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sliders, Check } from 'lucide-react';

interface BufferSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBuffer: number;
  onSelectBuffer: (buffer: number) => void;
}

export const BufferSettingsModal: React.FC<BufferSettingsModalProps> = ({
  isOpen,
  onClose,
  currentBuffer,
  onSelectBuffer,
}) => {
  if (!isOpen) return null;

  const bufferOptions = [30, 45, 60, 90];

  return (
    <div 
      id="buffer-settings-modal"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-800 font-technical uppercase">
              Corridor ROW Buffer Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Specify the statutory Right-of-Way (ROW) corridor buffer width applied symmetrically along the road centerline for spatial intersection calculations:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {bufferOptions.map((b) => (
              <button
                key={b}
                onClick={() => {
                  onSelectBuffer(b);
                  onClose();
                }}
                className={`py-2.5 px-3 rounded border font-technical font-semibold flex items-center justify-between transition-all ${
                  currentBuffer === b
                    ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>{b} Meters</span>
                {currentBuffer === b && <Check className="w-4 h-4 text-sky-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#006194] hover:bg-[#004e77] text-white rounded text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
