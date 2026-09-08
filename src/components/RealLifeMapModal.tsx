/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Globe, 
  Layers, 
  Compass, 
  Copy, 
  Check, 
  X, 
  LocateFixed, 
  Share2,
  Sparkles,
  Map as MapIcon
} from 'lucide-react';
import { UserLiveLocation } from '../types';
import { getMapLinks } from '../services/geolocationService';

interface RealLifeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLiveLocation | null;
  currentMapCenter: [number, number];
  onFlyToLocation: (lat: number, lng: number) => void;
  onGenerateParcelsAtLocation: (lat: number, lng: number) => void;
  onRequestLiveLocation: () => void;
  isLoadingLocation: boolean;
}

export const RealLifeMapModal: React.FC<RealLifeMapModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  currentMapCenter,
  onFlyToLocation,
  onGenerateParcelsAtLocation,
  onRequestLiveLocation,
  isLoadingLocation,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'osm' | 'google-link'>('osm');

  if (!isOpen) return null;

  // Prefer user location if available, otherwise current map center
  const activeLat = userLocation?.latitude ?? currentMapCenter[1];
  const activeLng = userLocation?.longitude ?? currentMapCenter[0];
  const links = getMapLinks(activeLat, activeLng);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        id="real-life-map-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Real-Life Geographic Map &amp; Live Location
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  LIVE GPS &amp; REAL SATELLITE
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-technical">
                Real world slippy map tiles, device GPS telemetry, and external Google Maps links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top GPS Status Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-600 text-white shadow-sm">
                <LocateFixed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                    {userLocation ? 'Real Device Live Location Detected' : 'Live Location GPS Standby'}
                  </span>
                  {userLocation && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1"></span>
                      GPS Active (±{userLocation.accuracy}m)
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {userLocation?.address || userLocation?.city 
                    ? `${userLocation.address || userLocation.city}, ${userLocation.state || ''} ${userLocation.country || ''}`
                    : `Viewing map coordinates: ${activeLat.toFixed(5)}° N, ${activeLng.toFixed(5)}° E`}
                </div>
                <div className="text-xs text-slate-500 font-technical mt-0.5">
                  Decimal Degrees: {activeLat.toFixed(6)}, {activeLng.toFixed(6)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="modal-get-gps-btn"
                onClick={onRequestLiveLocation}
                disabled={isLoadingLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                <Navigation className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                <span>{isLoadingLocation ? 'Acquiring GPS...' : 'Refresh My GPS Location'}</span>
              </button>

              <button
                id="modal-copy-coords-btn"
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                title="Copy Coordinates"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Coords'}</span>
              </button>
            </div>
          </div>

          {/* External Links Grid - Real Google Maps, Earth, Street View, OSM */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              Open In Real-World External Map Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Google Maps Link */}
              <a
                id="link-google-maps"
                href={links.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Google Maps
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Open coordinates in official Google Maps with turn-by-turn navigation &amp; places
                </p>
                <span className="text-[10px] font-semibold text-sky-600 mt-2 block">
                  maps.google.com →
                </span>
              </a>

              {/* Google Street View */}
              <a
                id="link-google-street-view"
                href={links.googleStreetView}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-lg border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Google Street View
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  View 360° street level panoramic imagery at this real location
                </p>
                <span className="text-[10px] font-semibold text-amber-600 mt-2 block">
                  Street View 360° →
                </span>
              </a>

              {/* OpenStreetMap Link */}
              <a
                id="link-osm"
                href={links.openStreetMap}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-lg border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    OpenStreetMap
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  View open community cartography, detailed roads, building footprints &amp; parcels
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 mt-2 block">
                  openstreetmap.org →
                </span>
              </a>

              {/* Google Earth 3D */}
              <a
                id="link-google-earth"
                href={links.earth}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Google Earth 3D
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fly around photorealistic 3D satellite topography and terrain
                </p>
                <span className="text-[10px] font-semibold text-indigo-600 mt-2 block">
                  earth.google.com →
                </span>
              </a>
            </div>
          </div>

          {/* Interactive Slippy Map Embed Preview */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <MapIcon className="w-4 h-4 text-sky-600" />
                <span>Live Real Map Frame</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Coordinates: {activeLat.toFixed(4)}, {activeLng.toFixed(4)}</span>
              </div>
            </div>

            <div className="w-full h-80 bg-slate-100 relative">
              <iframe
                title="Live Real Map"
                className="w-full h-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.008}%2C${activeLat - 0.006}%2C${activeLng + 0.008}%2C${activeLat + 0.006}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
              />
            </div>
          </div>

          {/* Quick Actions at Live Location */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Want to perform corridor alignment analysis at this location?
            </div>
            <div className="flex items-center gap-2">
              <button
                id="modal-fly-to-coords-btn"
                onClick={() => {
                  onFlyToLocation(activeLat, activeLng);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Center Main GIS Map Here</span>
              </button>

              <button
                id="modal-gen-parcels-btn"
                onClick={() => {
                  onGenerateParcelsAtLocation(activeLat, activeLng);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Cadastral Parcels at This Location</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Real-World GIS Base Providers: Esri ArcGIS World Imagery • OpenStreetMap • CartoDB</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
