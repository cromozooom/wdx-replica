/**
 * CutRequirement - specifies required cuts from stock
 * Units: millimeters (mm)
 */
export interface CutRequirement {
  /** Unique identifier */
  id: string;

  /** Type of member to cut */
  memberType: "stud" | "plate" | "noggin";

  /** Required length in mm */
  lengthMm: number;

  /** Timber section name (e.g., "47x100-c24") */
  sectionName?: string;

  /** Number of pieces required */
  quantity: number;
}

/**
 * CutPlan - optimized cutting plan from stock
 */
export interface CutPlan {
  /** Stock length being cut from in mm */
  stockLengthMm: number;

  /** List of cuts from this stock */
  cuts: CutRequirement[];

  /** Waste material in mm */
  wasteMm: number;
}
