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

  /** Which side(s) to place decorative studs: 'both', 'left', 'right', or 'none' */
  decorativeSide?: "both" | "left" | "right" | "none";

  /** Gap between structural studs in mm */
  studGapMm: number;

  /** Selected timber section ID for ALL structural members (e.g., "47x150-c24") */
  timberSection?: string;

  /** Wall thickness in mm (derived from timber section height) */
  wallThicknessMm?: number;

  /** Door opening configuration (front wall only) */
  hasDoorOpening?: boolean;

  /** Pillar width in mm (applies to both left and right pillars) */
  pillarWidthMm?: number;

  /** Left wall section width in mm (before left pillar) */
  leftWallWidthMm?: number;

  /** Door space width in mm (between the two pillars) */
  doorSpaceWidthMm?: number;

  /** Stud width in mm (default 45mm) */
  studWidthMm?: number;

  /** Selected stud section ID (e.g., "47x150-c24") - DEPRECATED: Use timberSection */
  studSection?: string;

  /** Selected top plate section ID - DEPRECATED: Use timberSection */
  topPlateSection?: string;

  /** Selected bottom plate section ID - DEPRECATED: Use timberSection */
  bottomPlateSection?: string;

  /** Include last stud even if it creates irregular gap */
  includeIrregularLastStud?: boolean;

  /** Include noggins (horizontal bracing between studs) */
  hasNoggins?: boolean;

  /** Selected PIR board ID for insulation */
  pirBoardId?: string;

  /** Selected sheet material ID for sheathing */
  sheetMaterialId?: string;

  /** Custom roof extension beyond front wall (mm) - roof only */
  roofFrontExtensionMm?: number;

  /** Custom roof extension beyond back wall (mm) - roof only */
  roofBackExtensionMm?: number;

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
