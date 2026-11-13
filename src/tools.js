import MileagePlanner from './tools/mileage/MileagePlanner'
import SplitCalculator from './tools/splits/SplitCalculator'

// Every tool on the page, in the order of the switch. The first is the default. A new tool is a folder
// under tools/ and one entry here; slugs are the hash links and must never change.
export const TOOLS = [
  { slug: 'weekly-mileage', short: 'Mileage', name: 'Weekly Mileage Planner', Component: MileagePlanner },
  { slug: 'track-splits', short: 'Splits', name: 'Track Split Calculator', Component: SplitCalculator },
]

export function findTool(slug) {
  return TOOLS.find(tool => tool.slug === slug) || TOOLS[0]
}
