import { Member } from "./member.model";

/**
 * Wall - represents a single wall (Front, Back, Left, Right)
 * Units: millimeters (mm)
 */
export interface Wall {
  /** Unique identifier */
  id: string;

  /** Wall name: Front, Back, Left, Right */
  name: string;

  /** Wall length in mm */
  lengthMm: number;

  /** Wall height in mm (derived for front/back; computed per stud for side walls) */
  heightMm: number;

  /** Indicates if this wall defines the master height */
  isMasterHeight: boolean;

  /** Decorative offset in mm for aesthetic studs */
  decorativeOffsetMm: number;

  /** Gap between structural studs in mm */
  studGapMm: number;

  /** Top plate thickness in mm */
  plateThicknessTopMm: number;

  /** Bottom plate thickness in mm */
  plateThicknessBottomMm: number;

  /** Door opening configuration (front wall only) */
  hasDoorOpening?: boolean;

  /** Pillar width in mm (left and right are equal) */
  pillarWidthMm?: number;

  /** Left full-height section width in mm */
  leftSectionWidthMm?: number;

  /** List of structural members (studs, plates, noggins) */
  members: Member[];
}

/**
 * Validation: Wall must have positive dimensions and stud gap
 */
export function validateWall(wall: Wall): boolean {
  return (
    wall.lengthMm > 0 && wall.studGapMm > 0 && wall.decorativeOffsetMm >= 0
  );
}
