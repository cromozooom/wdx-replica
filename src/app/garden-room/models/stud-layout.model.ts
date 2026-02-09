/**
 * StudLayout - manages stud positioning with clash resolution
 * Units: millimeters (mm)
 */
export interface StudLayout {
  /** Positions of structural studs in mm */
  standardStudPositionsMm: number[];

  /** Positions of decorative studs in mm */
  decorativeStudPositionsMm: number[];

  /** Final resolved positions after clash resolution in mm */
  resolvedStudPositionsMm: number[];

  /** Clash threshold in mm (default 50 mm) */
  clashThresholdMm: number;
}

/**
 * Clash resolution: merge positions within threshold, keeping decorative
 */
export function resolveStudClashes(layout: StudLayout): number[] {
  const threshold = layout.clashThresholdMm;
  const resolved: number[] = [...layout.decorativeStudPositionsMm];

  for (const stdPos of layout.standardStudPositionsMm) {
    const hasClash = layout.decorativeStudPositionsMm.some(
      (decPos) => Math.abs(decPos - stdPos) <= threshold,
    );

    if (!hasClash) {
      resolved.push(stdPos);
    }
  }

  return resolved.sort((a, b) => a - b);
}
