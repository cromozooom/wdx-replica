import { BuildEnvelope } from "./build-envelope.model";
import { Wall } from "./wall.model";
import { MaterialLibrary } from "./material-library.model";
import { HardwareRuleSet } from "./hardware-rule-set.model";
import { OutputBundle } from "./output-bundle.model";

/**
 * Project - top-level entity for garden room structural logic
 */
export interface Project {
  /** Unique identifier */
  id: string;

  /** Project name */
  name: string;

  /** Build envelope constraints */
  buildEnvelope: BuildEnvelope;

  /** List of walls (minimum 4: front, back, left, right) */
  walls: Wall[];

  /** Available materials */
  materials: MaterialLibrary;

  /** Hardware calculation rules */
  hardwareRules: HardwareRuleSet;

  /** Generated outputs */
  outputs: OutputBundle;
}

/**
 * Validation: Project must have at least 4 walls
 */
export function validateProject(project: Project): boolean {
  return project.walls.length >= 4;
}
