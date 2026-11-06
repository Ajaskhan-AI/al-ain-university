import type { CampusId } from './campus'

export type BuildingType = 'academic' | 'admin' | 'library' | 'labs' | 'student'

export interface Building {
  id: string // e.g. AIN-B2
  campus: CampusId
  name: string
  shortName: string
  type: BuildingType
  floors: number
  areaM2: number
  /** Typical peak electrical load during teaching days. Drives energy + SMDB data. */
  baseLoadKw: number
}

export type RoomType = 'classroom' | 'lecture_hall' | 'lab' | 'office' | 'washroom' | 'common'

export interface Room {
  id: string // e.g. AIN-B2-105 — also the room QR code value
  buildingId: string
  campus: CampusId
  name: string
  floor: string
  type: RoomType
}
