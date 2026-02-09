import { Injectable } from "@angular/core";
import {
  BuildEnvelope,
  calculateMaxWallFrameHeight,
} from "../models/build-envelope.model";
import { Wall } from "../models/wall.model";
import { Member } from "../models/member.model";
import { StudLayout, resolveStudClashes } from "../models/stud-layout.model";
import { NogginLayout } from "../models/noggin-layout.model";

/**
 * StructuralCalculationService - handles all structural calculations
 * for wall heights, stud layouts, and member positioning
 */
@Injectable({
  providedIn: "root",
})
export class StructuralCalculationService {
  /**
   * Calculate wall heights based on build envelope and fall ratio
   * @param envelope Build envelope constraints
   * @param walls List of walls to calculate heights for
   * @returns Updated walls with calculated heights
   */
  calculateWallHeights(envelope: BuildEnvelope, walls: Wall[]): Wall[] {
    const maxFrameHeight = calculateMaxWallFrameHeight(envelope);

    return walls.map((wall) => {
      if (wall.name === "Front" && wall.isMasterHeight) {
        return { ...wall, heightMm: maxFrameHeight };
      } else if (wall.name === "Back") {
        const frontWall = walls.find((w) => w.name === "Front");
        const spanMm = frontWall?.lengthMm || 0;
        return {
          ...wall,
          heightMm: this.calculateBackWallHeight(
            maxFrameHeight,
            spanMm,
            envelope.fallRatio,
          ),
        };
      }
      return wall;
    });
  }

  /**
   * Calculate back wall height using fall ratio
   * @param frontHeightMm Front wall height in mm
   * @param spanMm Span between front and back walls in mm
   * @param fallRatio Fall ratio { rise, run }
   * @returns Back wall height in mm
   */
  calculateBackWallHeight(
    frontHeightMm: number,
    spanMm: number,
    fallRatio: { rise: number; run: number },
  ): number {
    const fallMm = (spanMm * fallRatio.rise) / fallRatio.run;
    return frontHeightMm - fallMm;
  }

  /**
   * Calculate individual stud heights for side walls based on fall ratio
   * @param frontHeightMm Front wall height in mm
   * @param backHeightMm Back wall height in mm
   * @param wallLengthMm Side wall length in mm
   * @param studPositionsMm Array of stud positions along wall in mm
   * @returns Array of stud heights in mm
   */
  calculateSideWallStudHeights(
    frontHeightMm: number,
    backHeightMm: number,
    wallLengthMm: number,
    studPositionsMm: number[],
  ): number[] {
    const heightDifferenceMm = frontHeightMm - backHeightMm;

    return studPositionsMm.map((position) => {
      const ratio = position / wallLengthMm;
      return frontHeightMm - heightDifferenceMm * ratio;
    });
  }

  /**
   * Generate stud layout for a wall
   * @param wall Wall to generate layout for
   * @returns StudLayout with resolved positions
   */
  generateStudLayout(wall: Wall): StudLayout {
    // TODO: Implement stud layout generation
    // - Calculate standard stud positions based on studGapMm
    // - Calculate decorative stud positions based on decorativeOffsetMm
    // - Resolve clashes (keep decorative studs)
    return {
      standardStudPositionsMm: [],
      decorativeStudPositionsMm: [],
      resolvedStudPositionsMm: [],
      clashThresholdMm: 50,
    };
  }

  /**
   * Generate noggin layout for a wall
   * @param wall Wall to generate noggin layout for
   * @param studPositions Resolved stud positions
   * @returns NogginLayout with row positions
   */
  generateNogginLayout(wall: Wall, studPositions: number[]): NogginLayout {
    // TODO: Implement noggin layout generation
    // - Calculate noggin length from stud gap
    // - Determine row positions based on wall height
    // - Generate noggin positions between studs
    return {
      nogginLengthMm: 0,
      rows: [],
    };
  }

  /**
   * Create member entities from stud layout
   * @param wall Wall to create members for
   * @param studLayout Resolved stud layout
   * @returns Array of Member entities
   */
  createMembersFromLayout(wall: Wall, studLayout: StudLayout): Member[] {
    // TODO: Implement member creation
    // - Create stud members at resolved positions
    // - Create top and bottom plate members
    // - Calculate member lengths and heights
    return [];
  }

  /**
   * Validate wall height against build envelope
   * @param envelope Build envelope constraints
   * @param wall Wall to validate
   * @returns true if valid, false otherwise
   */
  validateWallHeight(envelope: BuildEnvelope, wall: Wall): boolean {
    const maxHeight = calculateMaxWallFrameHeight(envelope);
    return wall.heightMm > 0 && wall.heightMm <= maxHeight;
  }
}
