import type { AssetCategory, ChecklistItem } from '../types'

/** PPM checklist template per asset category. min/max = normal range for a reading. */
export const CHECKLIST_TEMPLATES: Record<AssetCategory, ChecklistItem[]> = {
  chiller: [
    { id: 'alarms', label: 'Check controller for active alarms', kind: 'check' },
    { id: 'leaks', label: 'Inspect for refrigerant / oil leaks', kind: 'check' },
    { id: 'chwSupply', label: 'Chilled water supply temp', kind: 'reading', unit: '°C', min: 5.5, max: 7.5 },
    { id: 'chwReturn', label: 'Chilled water return temp', kind: 'reading', unit: '°C', min: 11, max: 13.5 },
    { id: 'suction', label: 'Suction pressure', kind: 'reading', unit: 'bar', min: 3.2, max: 4.2 },
    { id: 'current', label: 'Compressor current', kind: 'reading', unit: 'A', min: 280, max: 420 },
  ],
  ahu: [
    { id: 'filters', label: 'Inspect / clean filters', kind: 'check' },
    { id: 'belt', label: 'Check belt tension and condition', kind: 'check' },
    { id: 'drain', label: 'Clean drain pan, check for blockage', kind: 'check' },
    { id: 'supplyTemp', label: 'Supply air temp', kind: 'reading', unit: '°C', min: 12, max: 15 },
    { id: 'returnTemp', label: 'Return air temp', kind: 'reading', unit: '°C', min: 22, max: 25 },
    { id: 'current', label: 'Fan motor current', kind: 'reading', unit: 'A', min: 14, max: 22 },
  ],
  pump: [
    { id: 'noise', label: 'Check for abnormal noise / vibration', kind: 'check' },
    { id: 'seal', label: 'Inspect mechanical seal for leaks', kind: 'check' },
    { id: 'pressure', label: 'Discharge pressure', kind: 'reading', unit: 'bar', min: 3, max: 4.5 },
    { id: 'current', label: 'Motor current', kind: 'reading', unit: 'A', min: 18, max: 30 },
  ],
  generator: [
    { id: 'testRun', label: 'Test run on load (15 min)', kind: 'check' },
    { id: 'coolant', label: 'Check coolant and oil levels', kind: 'check' },
    { id: 'fuel', label: 'Fuel tank level', kind: 'reading', unit: '%', min: 70, max: 100 },
    { id: 'battery', label: 'Battery voltage', kind: 'reading', unit: 'V', min: 24, max: 28.5 },
  ],
  smdb: [
    { id: 'thermal', label: 'Visual / thermal check for hot spots', kind: 'check' },
    { id: 'torque', label: 'Check terminal tightness', kind: 'check' },
    { id: 'breakers', label: 'All breakers in correct position', kind: 'check' },
    { id: 'current', label: 'Max phase current', kind: 'reading', unit: 'A', min: 80, max: 420 },
  ],
}
