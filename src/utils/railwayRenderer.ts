/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to render authentic 2-line cartographic railway tracks with perpendicular sleepers on HTML5 Canvas.
 * Supports straight lines, multi-vertex polylines, and curved splines.
 */

export interface RailwayRenderOptions {
  bufferPixelRadius?: number;
  showBuffer?: boolean;
  gaugePixels?: number; // Screen distance between the 2 steel rails
  sleeperSpacing?: number; // Pixel distance between consecutive railroad ties
  sleeperLength?: number; // Length of railroad ties across the rails
  isCurved?: boolean;
}

/**
 * Draws the railway track:
 * 1. Statutory Railway Safety ROW Corridor Buffer
 * 2. Ballast bed (gravel underlay)
 * 3. Railroad cross-ties (sleepers) spaced evenly along the alignment
 * 4. Distinct dual parallel steel rails (cased metallic lines)
 */
export function drawRailwayTrack(
  ctx: CanvasRenderingContext2D,
  screenPts: [number, number][],
  options: RailwayRenderOptions = {}
): void {
  if (!screenPts || screenPts.length < 2) return;

  const {
    bufferPixelRadius = 24,
    showBuffer = true,
    gaugePixels = 5,
    sleeperSpacing = 8,
    sleeperLength = 11,
  } = options;

  const halfGauge = gaugePixels / 2;
  const halfSleeper = sleeperLength / 2;

  // 1. STATUTORY RAILWAY CORRIDOR BUFFER ENVELOPE (Purple/Violet Theme)
  if (showBuffer && bufferPixelRadius > 0) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Translucent safety envelope
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.20)';
    ctx.lineWidth = bufferPixelRadius * 2;
    ctx.beginPath();
    ctx.moveTo(screenPts[0][0], screenPts[0][1]);
    for (let i = 1; i < screenPts.length; i++) {
      ctx.lineTo(screenPts[i][0], screenPts[i][1]);
    }
    ctx.stroke();

    // Corridor dashed boundary line
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.70)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }

  // Calculate cumulative distances and segment vectors
  const segLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < screenPts.length - 1; i++) {
    const dx = screenPts[i + 1][0] - screenPts[i][0];
    const dy = screenPts[i + 1][1] - screenPts[i][1];
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    totalLength += len;
  }

  if (totalLength <= 0) return;

  // 2. BALLAST BED (Dark gravel underlay beneath track)
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e293b'; // Slate ballast
  ctx.lineWidth = sleeperLength + 3;
  ctx.beginPath();
  ctx.moveTo(screenPts[0][0], screenPts[0][1]);
  for (let i = 1; i < screenPts.length; i++) {
    ctx.lineTo(screenPts[i][0], screenPts[i][1]);
  }
  ctx.stroke();

  // Subtle ballast texture line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = sleeperLength;
  ctx.stroke();
  ctx.restore();

  // 3. RAILROAD TIES / SLEEPERS (Perpendicular cross-bars)
  ctx.save();
  ctx.strokeStyle = '#090d16'; // Deep timber/concrete sleeper
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'butt';
  ctx.beginPath();

  // Walk along polyline at regular spacing intervals
  let currentDist = sleeperSpacing / 2;
  let segIdx = 0;
  let segAccum = 0;

  while (currentDist < totalLength && segIdx < segLengths.length) {
    // Find active segment
    while (segIdx < segLengths.length && currentDist > segAccum + segLengths[segIdx]) {
      segAccum += segLengths[segIdx];
      segIdx++;
    }

    if (segIdx >= segLengths.length) break;

    const segLen = segLengths[segIdx];
    if (segLen > 0) {
      const segFraction = (currentDist - segAccum) / segLen;
      const p1 = screenPts[segIdx];
      const p2 = screenPts[segIdx + 1];

      // Interpolated centerline point
      const cx = p1[0] + (p2[0] - p1[0]) * segFraction;
      const cy = p1[1] + (p2[1] - p1[1]) * segFraction;

      // Unit tangent & normal
      const tx = (p2[0] - p1[0]) / segLen;
      const ty = (p2[1] - p1[1]) / segLen;
      const nx = -ty;
      const ny = tx;

      // Draw sleeper
      ctx.moveTo(cx - nx * halfSleeper, cy - ny * halfSleeper);
      ctx.lineTo(cx + nx * halfSleeper, cy + ny * halfSleeper);
    }

    currentDist += sleeperSpacing;
  }
  ctx.stroke();
  ctx.restore();

  // 4. THE TWO DISTINCT PARALLEL STEEL RAILS
  // Calculate vertex normal offsets for left and right rails
  const leftRailPts: [number, number][] = [];
  const rightRailPts: [number, number][] = [];

  for (let i = 0; i < screenPts.length; i++) {
    let nx = 0;
    let ny = 0;

    if (i === 0) {
      // First point: use first segment normal
      const dx = screenPts[1][0] - screenPts[0][0];
      const dy = screenPts[1][1] - screenPts[0][1];
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else if (i === screenPts.length - 1) {
      // Last point: use last segment normal
      const dx = screenPts[i][0] - screenPts[i - 1][0];
      const dy = screenPts[i][1] - screenPts[i - 1][1];
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else {
      // Interior point: average segment normals (bisector normal)
      const dx1 = screenPts[i][0] - screenPts[i - 1][0];
      const dy1 = screenPts[i][1] - screenPts[i - 1][1];
      const len1 = Math.hypot(dx1, dy1) || 1;

      const dx2 = screenPts[i + 1][0] - screenPts[i][0];
      const dy2 = screenPts[i + 1][1] - screenPts[i][1];
      const len2 = Math.hypot(dx2, dy2) || 1;

      const n1x = -dy1 / len1;
      const n1y = dx1 / len1;
      const n2x = -dy2 / len2;
      const n2y = dx2 / len2;

      let bnx = n1x + n2x;
      let bny = n1y + n2y;
      const blen = Math.hypot(bnx, bny);
      if (blen > 0.001) {
        nx = bnx / blen;
        ny = bny / blen;
      } else {
        nx = n1x;
        ny = n1y;
      }
    }

    leftRailPts.push([screenPts[i][0] - nx * halfGauge, screenPts[i][1] - ny * halfGauge]);
    rightRailPts.push([screenPts[i][0] + nx * halfGauge, screenPts[i][1] + ny * halfGauge]);
  }

  // Draw Left Rail: Dark casing + bright metallic top
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Left rail dark casing
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(leftRailPts[0][0], leftRailPts[0][1]);
  for (let i = 1; i < leftRailPts.length; i++) {
    ctx.lineTo(leftRailPts[i][0], leftRailPts[i][1]);
  }
  ctx.stroke();

  // Left rail silver steel top
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Right rail dark casing
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(rightRailPts[0][0], rightRailPts[0][1]);
  for (let i = 1; i < rightRailPts.length; i++) {
    ctx.lineTo(rightRailPts[i][0], rightRailPts[i][1]);
  }
  ctx.stroke();

  // Right rail silver steel top
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the interactive control vertices, midpoints, and chainage labels for railway track.
 */
export function drawRailwayHandles(
  ctx: CanvasRenderingContext2D,
  controlScreenPts: [number, number][],
  options: {
    hoveredVertexIndex: number | null;
    draggedVertexIndex: number | null;
    hoveredMidpointIndex: number | null;
    isDrawingMode: boolean;
    isActiveAlignment: boolean;
  }
): void {
  if (!controlScreenPts || controlScreenPts.length === 0) return;

  const {
    hoveredVertexIndex,
    draggedVertexIndex,
    hoveredMidpointIndex,
    isDrawingMode,
    isActiveAlignment,
  } = options;

  // 1. Midpoint bend handles (+) between segments when active and not drawing
  if (!isDrawingMode && isActiveAlignment && controlScreenPts.length >= 2) {
    for (let i = 0; i < controlScreenPts.length - 1; i++) {
      const [p1x, p1y] = controlScreenPts[i];
      const [p2x, p2y] = controlScreenPts[i + 1];
      const mx = (p1x + p2x) / 2;
      const my = (p1y + p2y) / 2;
      const isMidHovered = hoveredMidpointIndex === i;

      ctx.save();
      ctx.fillStyle = isMidHovered ? '#C084FC' : 'rgba(192, 132, 252, 0.65)';
      ctx.strokeStyle = '#0B192C';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, isMidHovered ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isMidHovered) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', mx, my);
      }
      ctx.restore();
    }
  }

  // 2. Vertex Handles & Kilometer Station Labels
  controlScreenPts.forEach(([px, py], index) => {
    const isHovered = hoveredVertexIndex === index;
    const isDragged = draggedVertexIndex === index;

    ctx.save();

    // Drag halo
    if (isHovered || isDragged) {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vertex circle
    ctx.fillStyle = isDragged ? '#C084FC' : '#FFFFFF';
    ctx.strokeStyle = isDragged ? '#7E22CE' : '#9333EA';
    ctx.lineWidth = isDragged ? 3 : 2.5;
    ctx.beginPath();
    ctx.arc(px, py, isDragged ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Railway Station / Chainage Label (e.g. KM 14/2)
    if (index > 0 && index < controlScreenPts.length - 1) {
      const km = (14 + index * 0.4).toFixed(1).replace('.', '/');
      const label = `KM ${km}`;

      ctx.font = '600 10px "IBM Plex Sans", monospace';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#1e1b4b'; // Deep violet
      ctx.fillRect(px + 8, py - 16, textWidth + 8, 16);
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 8, py - 16, textWidth + 8, 16);

      ctx.fillStyle = '#E9D5FF';
      ctx.fillText(label, px + 12, py - 4);
    }
    ctx.restore();
  });
}
