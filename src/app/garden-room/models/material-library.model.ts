/**
 * MaterialLibrary - available stock lengths and sheet materials
 * Units: millimeters (mm)
 */
export interface MaterialLibrary {
  /** Available sheet materials */
  sheetMaterials: SheetMaterial[];

  /** Available timber sections with pricing */
  timberSections: TimberSection[];

  /** Available PIR insulation boards */
  pirBoards: PirBoard[];
}

/**
 * TimberSection - represents a timber section with dimensions and pricing
 */
export interface TimberSection {
  /** Unique identifier */
  id: string;

  /** Section name (e.g., "47x100 C24 Timber") */
  name: string;

  /** Cross-section width in mm */
  widthMm: number;

  /** Cross-section height in mm */
  heightMm: number;

  /** Material grade/type (e.g., "C24", "C16", "Treated") */
  grade?: string;

  /** Available lengths with pricing */
  lengthOptions: TimberLengthOption[];
}

/**
 * TimberLengthOption - represents a specific length option for a timber section
 */
export interface TimberLengthOption {
  /** Length in mm */
  lengthMm: number;

  /** Price per piece in currency units */
  pricePerPiece: number;

  /** Currency code (e.g., "GBP", "USD") */
  currency: string;

  /** Whether this length is currently available */
  available: boolean;
}

/**
 * SheetMaterial - represents a sheet material (plywood, OSB, etc.)
 */
export interface SheetMaterial {
  /** Unique identifier */
  id: string;

  /** Material name (e.g., "OSB3 Zero Sheet") */
  name: string;

  /** Sheet width in mm */
  widthMm: number;

  /** Sheet height in mm */
  heightMm: number;

  /** Sheet thickness in mm */
  thicknessMm: number;

  /** Price per sheet */
  pricePerSheet: number;

  /** Currency code (e.g., "GBP", "USD") */
  currency: string;

  /** Whether this sheet is currently available */
  available: boolean;
}

/**
 * PirBoard - represents a PIR insulation board
 */
export interface PirBoard {
  /** Unique identifier */
  id: string;

  /** Board name (e.g., "Kingspan TP10") */
  name: string;

  /** Board width in mm */
  widthMm: number;

  /** Board height in mm */
  heightMm: number;

  /** Board thickness in mm */
  thicknessMm: number;

  /** Thermal conductivity (W/m·K) */
  thermalConductivity: number;

  /** Price per board */
  pricePerBoard: number;

  /** Currency code (e.g., "GBP", "USD") */
  currency: string;

  /** Whether this board is currently available */
  available: boolean;
}
