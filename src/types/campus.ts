/** The two AAU campuses. Short codes are reused in QR tags, e.g. AAU-AIN-AHU-03. */
export type CampusId = 'AIN' | 'AUH'

/** What the campus switcher can be set to. 'ALL' = both campuses. */
export type CampusFilter = CampusId | 'ALL'

export interface Campus {
  id: CampusId
  name: string
  shortName: string
}
