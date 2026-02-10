/**
 * Build Envelope - defines legal height limits and system offsets
 * Units: millimeters (mm)
 */
export interface BuildEnvelope {
  /** Maximum legal height in mm (e.g., 2500 mm) */
  maxLegalHeightMm: number;

  /** Concrete foundation offset in mm */
  concreteOffsetMm: number;

  /** Roof system thickness in mm */
  roofSystemMm: number;

  /** Floor system thickness in mm */
  floorSystemMm: number;

  /** Fall ratio for drainage (default 1:40) */
  fallRatio: {
    rise: number;
    run: number;
  };
}

/**
 * Derived calculation for maximum wall frame height
 * @param envelope BuildEnvelope
 * @returns maxWallFrameHeightMm
 */
export function calculateMaxWallFrameHeight(envelope: BuildEnvelope): number {
  return (
    envelope.maxLegalHeightMm -
    envelope.concreteOffsetMm -
    envelope.roofSystemMm -
    envelope.floorSystemMm
  );
}

/**
 * Validation: maxWallFrameHeightMm must be > 0
 */
export function validateBuildEnvelope(envelope: BuildEnvelope): boolean {
  return calculateMaxWallFrameHeight(envelope) > 0;
}
