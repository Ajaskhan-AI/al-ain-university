import type { CampusId, Room, RoomType } from '../types'

/** [room number, name, floor, type] per building. 4 rooms × 10 buildings = 40. */
type RoomRow = [string, string, string, RoomType]

const ROOMS_BY_BUILDING: Record<string, RoomRow[]> = {
  'AIN-B1': [
    ['G04', 'Reception & Visitor Lobby', 'Ground', 'common'],
    ['112', 'Finance Office', '1st', 'office'],
    ['205', 'Meeting Room 205', '2nd', 'office'],
    ['G10', 'Washroom G10', 'Ground', 'washroom'],
  ],
  'AIN-B2': [
    ['105', 'Lecture Room 105', '1st', 'classroom'],
    ['118', 'Computer Lab 118', '1st', 'lab'],
    ['214', 'Electronics Lab 214', '2nd', 'lab'],
    ['G07', 'Washroom G07', 'Ground', 'washroom'],
  ],
  'AIN-B3': [
    ['G01', 'Main Reading Hall', 'Ground', 'common'],
    ['104', 'Group Study Room 104', '1st', 'classroom'],
    ['201', 'Quiet Study Floor', '2nd', 'common'],
    ['G05', 'Washroom G05', 'Ground', 'washroom'],
  ],
  'AIN-B4': [
    ['110', 'Chemistry Lab 110', '1st', 'lab'],
    ['115', 'Pharmaceutics Lab 115', '1st', 'lab'],
    ['208', 'Biology Lab 208', '2nd', 'lab'],
    ['G03', 'Washroom G03', 'Ground', 'washroom'],
  ],
  'AIN-B5': [
    ['012', 'Cafeteria Hall', 'Ground', 'common'],
    ['020', 'Prayer Room', 'Ground', 'common'],
    ['105', 'Student Clubs Room', '1st', 'office'],
    ['G08', 'Washroom G08', 'Ground', 'washroom'],
  ],
  'AIN-B6': [
    ['LH1', 'Lecture Hall 1', 'Ground', 'lecture_hall'],
    ['LH2', 'Lecture Hall 2', 'Ground', 'lecture_hall'],
    ['LH4', 'Lecture Hall 4', '1st', 'lecture_hall'],
    ['G02', 'Washroom G02', 'Ground', 'washroom'],
  ],
  'AUH-B1': [
    ['204', 'Classroom 204', '2nd', 'classroom'],
    ['310', 'Classroom 310', '3rd', 'classroom'],
    ['402', 'Computer Lab 402', '4th', 'lab'],
    ['G12', 'Washroom G12', 'Ground', 'washroom'],
  ],
  'AUH-B2': [
    ['G01', 'Admissions Counter', 'Ground', 'common'],
    ['105', 'Registrar Office', '1st', 'office'],
    ['210', 'Board Room', '2nd', 'office'],
    ['G06', 'Washroom G06', 'Ground', 'washroom'],
  ],
  'AUH-B3': [
    ['G02', 'Learning Commons', 'Ground', 'common'],
    ['107', 'Study Room 107', '1st', 'classroom'],
    ['112', 'Media Lab 112', '1st', 'lab'],
    ['G04', 'Washroom G04', 'Ground', 'washroom'],
  ],
  'AUH-B4': [
    ['G01', 'Sports Hall', 'Ground', 'common'],
    ['G15', 'Changing Room G15', 'Ground', 'washroom'],
    ['103', 'Student Services Desk', '1st', 'office'],
    ['110', 'Counselling Room 110', '1st', 'office'],
  ],
}

export const SEED_ROOMS: Room[] = Object.entries(ROOMS_BY_BUILDING).flatMap(([buildingId, rows]) =>
  rows.map(([number, name, floor, type]) => ({
    id: `${buildingId}-${number}`,
    buildingId,
    campus: buildingId.slice(0, 3) as CampusId,
    name,
    floor,
    type,
  })),
)
