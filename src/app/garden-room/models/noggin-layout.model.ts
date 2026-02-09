/**
 * NogginLayout - manages noggin placement between studs
 * Units: millimeters (mm)
 */
export interface NogginLayout {
  /** Length of each noggin in mm (derived from stud gap) */
  nogginLengthMm: number;

  /** Rows of noggins at different heights */
  rows: NogginRow[];
}

/**
 * NogginRow - represents a horizontal row of noggins
 */
export interface NogginRow {
  /** Vertical offset from bottom of wall in mm */
  offsetMm: number;

  /** X-positions of noggins in this row in mm */
  positionsMm: number[];
}
