/**
 * Member - represents a structural component (stud, plate, noggin)
 * Units: millimeters (mm)
 */
export interface Member {
  /** Unique identifier */
  id: string;

  /** Member type */
  type: "stud" | "plate" | "noggin";

  /** X-position along wall in mm */
  positionMm: number;

  /** Length of member in mm */
  lengthMm: number;

  /** Height of member in mm (applicable to studs) */
  heightMm: number;

  /** Timber section name (e.g., "47x100-c24") - used for pricing lookup */
  sectionName?: string;

  /** Additional metadata for extensibility */
  metadata: Record<string, unknown>;
}
