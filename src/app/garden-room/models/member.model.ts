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

  /** Additional metadata for extensibility */
  metadata: Record<string, unknown>;
}
