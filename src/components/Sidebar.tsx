/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Layers, 
  Route, 
  ListFilter, 
  SlidersHorizontal,
  Share2
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab = 'alignment', 
  onSelectTab 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'corridor', label: 'Corridor Projects', icon: FolderKanban },
    { id: 'cadastral', label: 'Cadastral Layers', icon: Layers },
    { id: 'alignment', label: 'Alignment & Impact', icon: Route, active: true },
    { id: 'logs', label: 'Intersection Logs', icon: ListFilter },
    { id: 'settings', label: 'GIS Settings', icon: SlidersHorizontal },
  ];

  return (
    <aside 
      id="gis-sidebar"
      className="w-64 bg-[#0B192C] text-slate-300 flex flex-col justify-between border-r border-[#1E3E62] flex-shrink-0 select-none"
    >
      <div>
        {/* Logo / System Masthead */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1E3E62]">
          <div className="w-8 h-8 rounded bg-[#0284C7] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-900/40">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none">NLAMS</div>
            <div className="text-[10px] text-sky-400 font-technical tracking-wider uppercase mt-1">
              GIS SPATIAL ENGINE | PRE-ACQ
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-technical">
            SPATIAL TOOLS
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || item.active;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#0284C7] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#1E3E62]/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Geometry Engine Status Pill */}
      <div className="p-4 border-t border-[#1E3E62]/80">
        <div className="bg-[#11243B] p-3 rounded border border-[#1E3E62] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-technical uppercase tracking-wider">
              GEOMETRY ENGINE
            </div>
            <div className="text-[11px] text-sky-400 font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              SPATIAL INTERSECTION READY
            </div>
          </div>
          <Share2 className="w-4 h-4 text-sky-400" />
        </div>
      </div>
    </aside>
  );
};
