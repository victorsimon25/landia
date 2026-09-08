/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MapTileProvider = 'osm-standard' | 'carto-voyager' | 'esri-satellite' | 'hybrid';

interface TileKey {
  z: number;
  x: number;
  y: number;
  provider: MapTileProvider;
}

class SlippyTileManager {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loading: Set<string> = new Set();
  private maxCacheSize: number = 350;
  private onTileLoaded?: () => void;

  public setTileLoadedCallback(callback: () => void) {
    this.onTileLoaded = callback;
  }

  private getTileUrl(provider: MapTileProvider, z: number, x: number, y: number): string {
    switch (provider) {
      case 'osm-standard': {
        // Standard official OpenStreetMap slippy tiles with load-balancing mirrors
        const osmSub = ['a', 'b', 'c'][(x + y) % 3];
        return `https://${osmSub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
      case 'carto-voyager': {
        // CartoDB Voyager - OpenStreetMap-derived high-clarity vector raster tiles
        const subdomains = ['a', 'b', 'c', 'd'];
        const sub = subdomains[(x + y) % subdomains.length];
        return `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
      }
      case 'esri-satellite':
      case 'hybrid':
        // High-resolution Esri World Imagery (global coverage, clear real-world satellite)
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      default: {
        const osmSub = ['a', 'b', 'c'][(x + y) % 3];
        return `https://${osmSub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
    }
  }

  private getOverlayUrl(provider: MapTileProvider, z: number, x: number, y: number): string | null {
    if (provider === 'hybrid') {
      // Esri World Boundaries and Places overlay for street names over satellite
      return `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`;
    }
    return null;
  }

  public getTile(provider: MapTileProvider, z: number, x: number, y: number): HTMLImageElement | null {
    const key = `${provider}:${z}:${x}:${y}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loading.has(key)) {
      return null;
    }

    this.loading.add(key);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.getTileUrl(provider, z, x, y);

    img.onload = () => {
      this.loading.delete(key);
      if (this.cache.size >= this.maxCacheSize) {
        // Evict oldest item
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(key, img);
      if (this.onTileLoaded) {
        this.onTileLoaded();
      }
    };

    img.onerror = () => {
      // Fallback: if osm-standard has a network hiccup or rate limit, fallback to CartoDB OSM mirror
      if (provider === 'osm-standard') {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        const sub = ['a', 'b', 'c'][(x + y) % 3];
        fallbackImg.src = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
        fallbackImg.onload = () => {
          this.loading.delete(key);
          this.cache.set(key, fallbackImg);
          if (this.onTileLoaded) this.onTileLoaded();
        };
        fallbackImg.onerror = () => {
          this.loading.delete(key);
        };
      } else {
        this.loading.delete(key);
      }
    };

    return null;
  }

  public getOverlayTile(provider: MapTileProvider, z: number, x: number, y: number): HTMLImageElement | null {
    const url = this.getOverlayUrl(provider, z, x, y);
    if (!url) return null;

    const key = `overlay:${provider}:${z}:${x}:${y}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loading.has(key)) {
      return null;
    }

    this.loading.add(key);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      this.loading.delete(key);
      this.cache.set(key, img);
      if (this.onTileLoaded) {
        this.onTileLoaded();
      }
    };

    img.onerror = () => {
      this.loading.delete(key);
    };

    return null;
  }
}

export const tileManager = new SlippyTileManager();

/**
 * Computes the range of slippy map tiles visible in the viewport and renders them.
 */
export function renderSlippyTiles({
  ctx,
  width,
  height,
  center,
  zoom,
  provider,
  project,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  center: [number, number];
  zoom: number;
  provider: MapTileProvider;
  project: (lng: number, lat: number, width: number, height: number) => [number, number];
}) {
  // Integer base zoom level for tiles (clamped between 1 and 19)
  const intZoom = Math.max(1, Math.min(19, Math.floor(zoom)));
  const numTilesAtZoom = Math.pow(2, intZoom);

  // Convert center to tile coordinates
  const centerTileX = ((center[0] + 180) / 360) * numTilesAtZoom;
  const centerLatRad = (center[1] * Math.PI) / 180;
  const centerTileY =
    ((1 - Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2)) / Math.PI) / 2) * numTilesAtZoom;

  // Estimate number of tiles covering screen
  const scaleDiff = Math.pow(2, zoom - intZoom);
  const tilePixelSize = 256 * scaleDiff;

  const halfTilesX = Math.ceil(width / (2 * tilePixelSize)) + 1;
  const halfTilesY = Math.ceil(height / (2 * tilePixelSize)) + 1;

  const minTileX = Math.max(0, Math.floor(centerTileX - halfTilesX));
  const maxTileX = Math.min(numTilesAtZoom - 1, Math.ceil(centerTileX + halfTilesX));
  const minTileY = Math.max(0, Math.floor(centerTileY - halfTilesY));
  const maxTileY = Math.min(numTilesAtZoom - 1, Math.ceil(centerTileY + halfTilesY));

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  // Draw base tiles
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      // Calculate tile geographic bounds
      const nwLng = (tx / numTilesAtZoom) * 360 - 180;
      const nwLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / numTilesAtZoom)));
      const nwLat = (nwLatRad * 180) / Math.PI;

      const seLng = ((tx + 1) / numTilesAtZoom) * 360 - 180;
      const seLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 1)) / numTilesAtZoom)));
      const seLat = (seLatRad * 180) / Math.PI;

      const [x1, y1] = project(nwLng, nwLat, width, height);
      const [x2, y2] = project(seLng, seLat, width, height);

      const tileW = Math.ceil(x2 - x1);
      const tileH = Math.ceil(y2 - y1);

      // Check if tile is on screen
      if (x1 + tileW < 0 || x1 > width || y1 + tileH < 0 || y1 > height) {
        continue;
      }

      const img = tileManager.getTile(provider, intZoom, tx, ty);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, Math.floor(x1), Math.floor(y1), tileW + 1, tileH + 1);
      } else {
        // Subtle placeholder tone while tile streams in
        ctx.fillStyle = provider === 'osm-standard' || provider === 'carto-voyager' ? '#e2e8f0' : '#0f172a';
        ctx.fillRect(Math.floor(x1), Math.floor(y1), tileW, tileH);
      }

      // If hybrid, draw labels overlay on top
      if (provider === 'hybrid') {
        const overlayImg = tileManager.getOverlayTile(provider, intZoom, tx, ty);
        if (overlayImg && overlayImg.complete && overlayImg.naturalWidth > 0) {
          ctx.drawImage(overlayImg, Math.floor(x1), Math.floor(y1), tileW + 1, tileH + 1);
        }
      }
    }
  }

  ctx.restore();
}
