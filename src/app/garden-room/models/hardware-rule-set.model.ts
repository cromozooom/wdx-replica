/**
 * HardwareRuleSet - defines hardware calculation rules
 * Units vary per rule
 */
export interface HardwareRuleSet {
  /** Number of screws required per linear meter */
  screwsPerLinearMeter: number;

  /** Tape required per square meter */
  tapePerSquareMeter: number;

  /** Membrane required per square meter */
  membranePerSquareMeter: number;
}
