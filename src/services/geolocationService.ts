/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserLiveLocation, CadastralParcel } from '../types';

/**
 * Requests the user's high-accuracy real-time GPS location via the browser's Geolocation API.
 */
export function getCurrentUserLocation(): Promise<UserLiveLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser or environment.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const liveLoc: UserLiveLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp || Date.now(),
        };
        resolve(liveLoc);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable. Check your device GPS / network.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out. Please try again.';
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Reverse geocodes coordinates to a human-readable location name via OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<{
  displayName: string;
  city: string;
  state: string;
  country: string;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Local Area';
    const state = addr.state || addr.region || '';
    const country = addr.country || '';
    const displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      displayName,
      city,
      state,
      country,
    };
  } catch (err) {
    console.warn('Reverse geocoding failed or offline:', err);
    return {
      displayName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      city: 'Live Location Area',
      state: '',
      country: '',
    };
  }
}

/**
 * Generates sample cadastral parcels centered directly around the user's live coordinates.
 * This enables the user to test highway and railway corridor alignment analysis right in their own real neighborhood.
 */
export function generateParcelsAroundLocation(
  centerLat: number,
  centerLng: number,
  prefix: string = 'LIVE-LOC'
): CadastralParcel[] {
  const parcels: CadastralParcel[] = [];
  const rows = 3;
  const cols = 4;
  const parcelWidthDeg = 0.0018; // approx 190m
  const parcelHeightDeg = 0.0014; // approx 155m
  const marginDeg = 0.00015;

  const startLat = centerLat - (rows * parcelHeightDeg) / 2;
  const startLng = centerLng - (cols * parcelWidthDeg) / 2;

  let count = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const minLng = startLng + c * parcelWidthDeg + marginDeg;
      const maxLng = startLng + (c + 1) * parcelWidthDeg - marginDeg;
      const minLat = startLat + r * parcelHeightDeg + marginDeg;
      const maxLat = startLat + (r + 1) * parcelHeightDeg - marginDeg;

      // Add a slight realistic organic polygon jitter
      const jitter1 = ((count * 7) % 11 - 5) * 0.00004;
      const jitter2 = ((count * 13) % 11 - 5) * 0.00004;

      const coordinates: [number, number][] = [
        [minLng + jitter1, minLat],
        [maxLng, minLat + jitter2],
        [maxLng + jitter2, maxLat],
        [minLng, maxLat + jitter1],
        [minLng + jitter1, minLat], // close polygon
      ];

      parcels.push({
        parcelId: `${prefix}-${String(count).padStart(3, '0')}`,
        coordinates,
      });

      count++;
    }
  }

  return parcels;
}

/**
 * Generates initial baseline Route A & Route B alignments passing across the user's live location.
 */
export function generateAlignmentsAroundLocation(centerLat: number, centerLng: number) {
  const dLng = 0.0035;
  const dLat = 0.0025;

  const routeA: [number, number][] = [
    [centerLng - dLng * 1.5, centerLat - dLat * 1.2],
    [centerLng - dLng * 0.7, centerLat - dLat * 0.4],
    [centerLng, centerLat + dLat * 0.1],
    [centerLng + dLng * 0.8, centerLat + dLat * 0.6],
    [centerLng + dLng * 1.5, centerLat + dLat * 1.3],
  ];

  const routeB: [number, number][] = [
    [centerLng - dLng * 1.5, centerLat - dLat * 1.2],
    [centerLng - dLng * 0.5, centerLat - dLat * 0.8],
    [centerLng + dLng * 0.2, centerLat - dLat * 0.1],
    [centerLng + dLng * 0.9, centerLat + dLat * 0.5],
    [centerLng + dLng * 1.5, centerLat + dLat * 1.3],
  ];

  return { routeA, routeB };
}

/**
 * Creates external real map URL links for the given coordinates.
 */
export function getMapLinks(lat: number, lng: number) {
  return {
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    googleStreetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
    googleDirections: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    openStreetMap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
    earth: `https://earth.google.com/web/@${lat},${lng},150a,800d,35y,0h,0t,0r`,
  };
}
