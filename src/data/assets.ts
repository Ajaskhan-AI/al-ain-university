import type { Asset, AssetCategory, CampusId, Trade } from '../types'

/**
 * 25 fictional plant assets. "monitored" ones (12) have CT clamps and appear in
 * Predictive Maintenance. Fire pumps are intentionally excluded (CLAUDE.md).
 */
type AssetRow = [
  id: string,
  name: string,
  category: AssetCategory,
  buildingId: string,
  location: string,
  description: string,
  installYear: number,
  trade: Trade,
  monitored: boolean,
  smdbId?: string,
]

const ROWS: AssetRow[] = [
  // Al Ain Campus
  ['AAU-AIN-CH-01', 'Chiller 1', 'chiller', 'AIN-B4', 'Central chiller plant', 'Water-cooled screw chiller, 450 TR', 2014, 'hvac', true],
  ['AAU-AIN-CH-02', 'Chiller 2', 'chiller', 'AIN-B4', 'Central chiller plant', 'Water-cooled screw chiller, 450 TR', 2014, 'hvac', true],
  ['AAU-AIN-AHU-01', 'AHU-01 Engineering', 'ahu', 'AIN-B2', 'Roof, east side', 'Air handling unit, 12,000 L/s', 2016, 'hvac', true],
  ['AAU-AIN-AHU-02', 'AHU-02 Library', 'ahu', 'AIN-B3', 'Roof plant room', 'Air handling unit, 9,000 L/s', 2015, 'hvac', true],
  ['AAU-AIN-AHU-03', 'AHU-03 Lecture Halls', 'ahu', 'AIN-B6', 'Roof, LH1–LH2 zone', 'Air handling unit, 14,000 L/s', 2017, 'hvac', true],
  ['AAU-AIN-AHU-04', 'AHU-04 Student Centre', 'ahu', 'AIN-B5', 'Roof plant room', 'Air handling unit, 8,000 L/s', 2018, 'hvac', false],
  ['AAU-AIN-AHU-05', 'AHU-05 Administration', 'ahu', 'AIN-B1', 'Roof plant room', 'Air handling unit, 6,500 L/s', 2013, 'hvac', false],
  ['AAU-AIN-PMP-01', 'CHW Primary Pump 1', 'pump', 'AIN-B4', 'Central chiller plant', 'Chilled water primary pump, 37 kW', 2014, 'hvac', true],
  ['AAU-AIN-PMP-02', 'CHW Secondary Pump 1', 'pump', 'AIN-B4', 'Central chiller plant', 'Chilled water secondary pump, 30 kW', 2014, 'hvac', true],
  ['AAU-AIN-PMP-03', 'Domestic Water Booster Pump', 'pump', 'AIN-B5', 'Basement pump room', 'Booster set, 2 × 7.5 kW', 2019, 'plumbing', false],
  ['AAU-AIN-PMP-04', 'Drainage Sump Pump', 'pump', 'AIN-B6', 'Basement sump', 'Submersible sump pump, 4 kW', 2017, 'plumbing', false],
  ['AAU-AIN-GEN-01', 'Standby Generator 1', 'generator', 'AIN-B1', 'Generator yard', 'Diesel generator, 500 kVA', 2012, 'electrical', false],
  ['AAU-AIN-GEN-02', 'Standby Generator 2', 'generator', 'AIN-B4', 'Generator yard', 'Diesel generator, 800 kVA', 2014, 'electrical', false],
  ['AAU-AIN-SMDB-01', 'SMDB-01 Engineering', 'smdb', 'AIN-B2', 'Ground floor electrical room', 'Sub-main distribution board', 2016, 'electrical', false, 'SMDB-AIN-B2-01'],
  ['AAU-AIN-SMDB-02', 'SMDB-01 Science Labs', 'smdb', 'AIN-B4', 'Ground floor electrical room', 'Sub-main distribution board', 2014, 'electrical', false, 'SMDB-AIN-B4-01'],
  // Abu Dhabi Campus
  ['AAU-AUH-CH-01', 'Chiller 1', 'chiller', 'AUH-B1', 'Roof chiller deck', 'Air-cooled screw chiller, 300 TR', 2017, 'hvac', true],
  ['AAU-AUH-CH-02', 'Chiller 2', 'chiller', 'AUH-B1', 'Roof chiller deck', 'Air-cooled screw chiller, 300 TR', 2017, 'hvac', true],
  ['AAU-AUH-AHU-01', 'AHU-01 Academic', 'ahu', 'AUH-B1', 'Level 5 plant room', 'Air handling unit, 13,000 L/s', 2017, 'hvac', true],
  ['AAU-AUH-AHU-02', 'AHU-02 Library', 'ahu', 'AUH-B3', 'Roof plant room', 'Air handling unit, 7,500 L/s', 2018, 'hvac', true],
  ['AAU-AUH-AHU-03', 'AHU-03 Sports Hall', 'ahu', 'AUH-B4', 'Roof plant room', 'Air handling unit, 11,000 L/s', 2019, 'hvac', false],
  ['AAU-AUH-PMP-01', 'CHW Pump 1', 'pump', 'AUH-B1', 'Basement pump room', 'Chilled water pump, 22 kW', 2017, 'hvac', true],
  ['AAU-AUH-PMP-02', 'Domestic Water Booster Pump', 'pump', 'AUH-B2', 'Basement pump room', 'Booster set, 2 × 5.5 kW', 2018, 'plumbing', false],
  ['AAU-AUH-GEN-01', 'Standby Generator 1', 'generator', 'AUH-B1', 'Generator room', 'Diesel generator, 630 kVA', 2017, 'electrical', false],
  ['AAU-AUH-SMDB-01', 'SMDB-01 Academic', 'smdb', 'AUH-B1', 'Ground floor electrical room', 'Sub-main distribution board', 2017, 'electrical', false, 'SMDB-AUH-B1-01'],
  ['AAU-AUH-SMDB-02', 'SMDB-02 Student Services', 'smdb', 'AUH-B4', 'Roof plant room (HVAC)', 'Sub-main distribution board', 2019, 'electrical', false, 'SMDB-AUH-B4-02'],
]

export function buildSeedAssets(createdAt: string): Asset[] {
  return ROWS.map(([id, name, category, buildingId, location, description, installYear, trade, monitored, smdbId]) => ({
    id,
    name,
    category,
    campus: buildingId.slice(0, 3) as CampusId,
    buildingId,
    location,
    description,
    installYear,
    trade,
    monitored,
    ...(smdbId ? { smdbId } : {}),
    createdAt,
  }))
}
