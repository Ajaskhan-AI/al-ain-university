import type { Building } from '../types'

/** Fictional building list for the demo — not AAU's real building register. */
export const BUILDINGS: Building[] = [
  // Al Ain Campus
  { id: 'AIN-B1', campus: 'AIN', name: 'Main Administration Building', shortName: 'Admin', type: 'admin', floors: 3, areaM2: 6200, baseLoadKw: 180 },
  { id: 'AIN-B2', campus: 'AIN', name: 'College of Engineering & IT', shortName: 'Engineering', type: 'academic', floors: 4, areaM2: 11800, baseLoadKw: 320 },
  { id: 'AIN-B3', campus: 'AIN', name: 'Central Library', shortName: 'Library', type: 'library', floors: 3, areaM2: 5400, baseLoadKw: 160 },
  { id: 'AIN-B4', campus: 'AIN', name: 'Science Labs & Central Plant', shortName: 'Science Labs', type: 'labs', floors: 3, areaM2: 9600, baseLoadKw: 380 },
  { id: 'AIN-B5', campus: 'AIN', name: 'Student Centre & Cafeteria', shortName: 'Student Centre', type: 'student', floors: 2, areaM2: 5800, baseLoadKw: 210 },
  { id: 'AIN-B6', campus: 'AIN', name: 'Lecture Halls Complex', shortName: 'Lecture Halls', type: 'academic', floors: 2, areaM2: 7600, baseLoadKw: 260 },
  // Abu Dhabi Campus
  { id: 'AUH-B1', campus: 'AUH', name: 'Main Academic Building', shortName: 'Academic', type: 'academic', floors: 5, areaM2: 12500, baseLoadKw: 300 },
  { id: 'AUH-B2', campus: 'AUH', name: 'Administration & Admissions', shortName: 'Admin', type: 'admin', floors: 3, areaM2: 4800, baseLoadKw: 140 },
  { id: 'AUH-B3', campus: 'AUH', name: 'Library & Learning Commons', shortName: 'Library', type: 'library', floors: 2, areaM2: 4600, baseLoadKw: 150 },
  { id: 'AUH-B4', campus: 'AUH', name: 'Student Services & Sports Hall', shortName: 'Student Services', type: 'student', floors: 2, areaM2: 6900, baseLoadKw: 190 },
]

const BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]))

export function getBuilding(id: string): Building | undefined {
  return BY_ID.get(id)
}
