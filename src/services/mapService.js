// Backend integration point for the interactive state map.
//
// Expected endpoint: GET /api/map/states
// Expected response shape:
//   {
//     states: [
//       {
//         id: string,           // e.g. "MH", "UP"
//         name: string,         // e.g. "Maharashtra"
//         totalProjects: number,
//         proposedHa: number,
//         acquiredHa: number,
//         acquiredPercent: number,
//         compensationDisbursedPercent: number,
//       }
//     ]
//   }
//
// To connect the real backend, uncomment the fetch() block below and remove the throw.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function fetchStateMapData() {
  // Real implementation (uncomment when backend is ready):
  // const res = await fetch(`${API_BASE_URL}/map/states`, { credentials: 'include' })
  // if (!res.ok) throw new Error('Failed to load state map data')
  // return res.json()

  throw new Error('State map API is not yet available')
}
