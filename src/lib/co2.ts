/**
 * Scope 2 (purchased electricity) CO2 estimate — location-based method:
 * tonnes CO2e = kWh × grid emission factor ÷ 1000.
 *
 * The factor below is an INDICATIVE value for the UAE grid, used for the demo
 * only. In a pilot it is replaced with the factor published by the utility /
 * the one AAU uses for its sustainability reporting.
 */
export const GRID_FACTOR_KG_PER_KWH = 0.4

export const EMISSION_FACTOR_NOTE =
  'Indicative UAE grid emission factor of 0.40 kg CO2e/kWh (location-based Scope 2). ' +
  'To be replaced with the officially published factor during the pilot.'

export function kwhToTonnesCo2(kwh: number): number {
  return (kwh * GRID_FACTOR_KG_PER_KWH) / 1000
}
