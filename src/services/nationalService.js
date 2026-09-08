import { NATIONAL_STATS } from './mock/mockNationalStats.js'

export async function getNationalStats() {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return NATIONAL_STATS
}
