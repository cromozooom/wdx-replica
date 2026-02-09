/**
 * MaterialLibrary - available stock lengths and sheet materials
 * Units: millimeters (mm)
 */
export interface MaterialLibrary {
  /** Available timber stock lengths in mm (e.g., 2400, 3600, 4800) */
  stockLengthsMm: number[];

  /** Available sheet materials */
  sheetMaterials: SheetMaterial[];
}

/**
 * SheetMaterial - represents a sheet material (plywood, OSB, etc.)
 */
export interface SheetMaterial {
  /** Unique identifier */
  id: string;

  /** Material name (e.g., "18mm Plywood") */
  name: string;

  /** Sheet width in mm */
  widthMm: number;

  /** Sheet height in mm */
  heightMm: number;
}
