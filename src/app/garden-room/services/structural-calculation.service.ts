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
    const standardPositions = this.placeStandardStuds(
      wall.lengthMm,
      wall.studGapMm,
    );
    const decorativePositions = this.placeDecorativeStuds(
      wall.lengthMm,
      wall.decorativeOffsetMm,
    );
    const resolvedPositions = this.resolveStudClashes(
      standardPositions,
      decorativePositions,
      50,
    );

    return {
      standardStudPositionsMm: standardPositions,
      decorativeStudPositionsMm: decorativePositions,
      resolvedStudPositionsMm: resolvedPositions,
      clashThresholdMm: 50,
    };
  }

  /**
   * Place standard structural studs at regular intervals
   * @param wallLengthMm Wall length in mm
   * @param studGapMm Gap between studs in mm
   * @returns Array of stud positions in mm
   */
  placeStandardStuds(wallLengthMm: number, studGapMm: number): number[] {
    const positions: number[] = [];
    // Start with studs at 0 and end
    positions.push(0);

    // Place intermediate studs
    let position = studGapMm;
    while (position < wallLengthMm) {
      positions.push(position);
      position += studGapMm;
    }

    // End stud
    if (positions[positions.length - 1] !== wallLengthMm) {
      positions.push(wallLengthMm);
    }

    return positions;
  }

  /**
   * Place decorative studs at offset positions from wall ends
   * @param wallLengthMm Wall length in mm
   * @param decorativeOffsetMm Offset from ends in mm
   * @returns Array of decorative stud positions in mm
   */
  placeDecorativeStuds(
    wallLengthMm: number,
    decorativeOffsetMm: number,
  ): number[] {
    if (decorativeOffsetMm <= 0) {
      return [];
    }

    const positions: number[] = [];
    // Left end decorative stud
    if (decorativeOffsetMm < wallLengthMm / 2) {
      positions.push(decorativeOffsetMm);
    }
    // Right end decorative stud
    if (wallLengthMm - decorativeOffsetMm > wallLengthMm / 2) {
      positions.push(wallLengthMm - decorativeOffsetMm);
    }

    return positions;
  }

  /**
   * Resolve stud clashes - keep decorative studs, remove clashing standard studs
   * @param standardPositions Standard stud positions in mm
   * @param decorativePositions Decorative stud positions in mm
   * @param clashThresholdMm Clash threshold in mm (default 50mm)
   * @returns Resolved stud positions in mm
   */
  resolveStudClashes(
    standardPositions: number[],
    decorativePositions: number[],
    clashThresholdMm: number,
  ): number[] {
    const resolved: number[] = [...decorativePositions];

    for (const stdPos of standardPositions) {
      const hasClash = decorativePositions.some(
        (decPos) => Math.abs(decPos - stdPos) <= clashThresholdMm,
      );

      if (!hasClash) {
        resolved.push(stdPos);
      }
    }

    return resolved.sort((a, b) => a - b);
  }

  /**
   * Generate noggin layout for a wall
   * @param wall Wall to generate noggin layout for
   * @param studPositions Resolved stud positions
   * @returns NogginLayout with row positions
   */
  generateNogginLayout(wall: Wall, studPositions: number[]): NogginLayout {
    const nogginLengthMm = wall.studGapMm;
    const rows: any[] = [];

    // Calculate row positions (e.g., every 600mm vertically)
    const rowSpacingMm = 600;
    const numberOfRows = Math.floor(wall.heightMm / rowSpacingMm);

    for (let i = 1; i <= numberOfRows; i++) {
      const offsetMm = i * rowSpacingMm;
      const positionsMm: number[] = [];

      // Stagger rows: even rows offset by half gap
      const staggerOffset = i % 2 === 0 ? wall.studGapMm / 2 : 0;

      // Place noggins between studs
      for (let j = 0; j < studPositions.length - 1; j++) {
        const nogginPosition = studPositions[j] + staggerOffset;
        if (nogginPosition < studPositions[j + 1]) {
          positionsMm.push(nogginPosition);
        }
      }

      rows.push({ offsetMm, positionsMm });
    }

    return {
      nogginLengthMm,
      rows,
    };
  }

  /**
   * Adjust stud heights by subtracting plate thicknesses
   * @param studHeightMm Original stud height in mm
   * @param plateThicknessTopMm Top plate thickness in mm
   * @param plateThicknessBottomMm Bottom plate thickness in mm
   * @returns Adjusted stud height in mm
   */
  adjustStudHeightsForPlates(
    studHeightMm: number,
    plateThicknessTopMm: number,
    plateThicknessBottomMm: number,
  ): number {
    return studHeightMm - plateThicknessTopMm - plateThicknessBottomMm;
  }

  /**
   * Calculate top plate length for side walls (hypotenuse)
   * @param wallLengthMm Side wall length in mm
   * @param frontHeightMm Front wall height in mm
   * @param backHeightMm Back wall height in mm
   * @returns Top plate length in mm
   */
  calculateSideWallTopPlateLength(
    wallLengthMm: number,
    frontHeightMm: number,
    backHeightMm: number,
  ): number {
    const heightDifferenceMm = Math.abs(frontHeightMm - backHeightMm);
    return Math.sqrt(
      Math.pow(wallLengthMm, 2) + Math.pow(heightDifferenceMm, 2),
    );
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
