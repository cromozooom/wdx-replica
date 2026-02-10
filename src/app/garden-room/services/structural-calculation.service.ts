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
   * @param startFromRight If true, calculate positions starting from the right edge (useful for right wall sections)
   * @returns StudLayout with resolved positions
   */
  generateStudLayout(wall: Wall, startFromRight: boolean = false): StudLayout {
    const studWidthMm = wall.studWidthMm || 45;
    const includeIrregularLast = wall.includeIrregularLastStud ?? true;
    const decorativeSide = wall.decorativeSide || "both";
    const decorativeOffsetMm = wall.decorativeOffsetMm || 0;

    // First, place decorative studs (only if offset > 0 AND side is not 'none')
    const decorativePositions =
      decorativeOffsetMm > 0 && decorativeSide !== "none"
        ? this.placeDecorativeStuds(
            wall.lengthMm,
            decorativeOffsetMm,
            studWidthMm,
            decorativeSide,
            startFromRight,
          )
        : [];

    // Then place standard studs with decorative positions as boundaries
    const standardPositions = this.placeStandardStuds(
      wall.lengthMm,
      wall.studGapMm,
      studWidthMm,
      includeIrregularLast,
      decorativePositions,
      startFromRight,
    );

    // Combine all positions and sort
    const resolvedPositions = [...standardPositions, ...decorativePositions]
      .sort((a, b) => a - b)
      // Remove duplicates
      .filter((pos, index, arr) => index === 0 || pos !== arr[index - 1]);

    return {
      standardStudPositionsMm: standardPositions,
      decorativeStudPositionsMm: decorativePositions,
      resolvedStudPositionsMm: resolvedPositions,
      clashThresholdMm: 50,
    };
  }

  /**
   * Place standard structural studs with equal spacing
   * Decorative studs reduce available space - standard studs fill the remaining area
   * Algorithm:
   * 1. Always place first stud at position 0 (or last stud at wall end if startFromRight)
   * 2. If decorative studs exist, calculate available space between them
   * 3. Place studs at equal intervals in the available space
   * 4. Optionally include irregular last stud
   * NOTE: studGapMm is edge-to-edge gap, so on-center spacing = studGapMm + studWidthMm
   * @param wallLengthMm Wall length in mm
   * @param studGapMm Desired gap between studs in mm (edge-to-edge spacing)
   * @param studWidthMm Stud width in mm
   * @param includeIrregularLast Include last stud if gap is irregular
   * @param decorativePositions Positions of decorative studs that reduce available space
   * @param startFromRight If true, start placing studs from the right edge instead of left
   * @returns Array of stud positions in mm (center positions)
   */
  placeStandardStuds(
    wallLengthMm: number,
    studGapMm: number,
    studWidthMm: number = 45,
    includeIrregularLast: boolean = true,
    decorativePositions: number[] = [],
    startFromRight: boolean = false,
  ): number[] {
    const positions: number[] = [];

    // Calculate on-center spacing from edge-to-edge gap
    const onCenterSpacing = studGapMm + studWidthMm;

    // Determine start and end stud positions based on direction
    const startStudPosition = startFromRight ? wallLengthMm - studWidthMm : 0;
    const endStudPosition = startFromRight ? 0 : wallLengthMm - studWidthMm;

    // Always start with a stud at the starting position
    positions.push(startStudPosition);

    // Determine boundaries based on decorative stud positions
    const sortedDecorative = [...decorativePositions].sort((a, b) => a - b);

    // If there are NO decorative studs, place studs with FIXED spacing
    if (sortedDecorative.length === 0) {
      // ALWAYS place end stud flush with wall edge
      const endStud = startFromRight ? 0 : wallLengthMm - studWidthMm;
      positions.push(endStud);

      // Place intermediate studs with FIXED on-center spacing
      let currentPosition = startStudPosition;

      while (true) {
        // Calculate next position
        const nextPosition = startFromRight
          ? currentPosition - onCenterSpacing
          : currentPosition + onCenterSpacing;

        // Check if next position would exceed the end stud
        if (startFromRight) {
          if (nextPosition <= endStud + studWidthMm) break; // Would overlap with end stud
        } else {
          if (nextPosition >= endStud) break; // Would overlap with end stud
        }

        currentPosition = nextPosition;
        positions.push(currentPosition);
      }

      return positions.sort((a, b) => a - b);
    }

    // If there ARE decorative studs, place studs only BETWEEN decorative boundaries
    // Pattern: start stud -> gap -> left decorative -> gap -> standard studs -> gap -> right decorative -> gap -> end stud

    // Determine which decoratives exist based on their position relative to wall center
    const wallCenter = wallLengthMm / 2;
    const leftDecorative = sortedDecorative.find((pos) => pos < wallCenter);
    const rightDecorative = sortedDecorative.find((pos) => pos >= wallCenter);

    // If we have both left and right decoratives, place studs between them with FIXED spacing
    if (leftDecorative !== undefined && rightDecorative !== undefined) {
      // Place studs between the two decoratives with fixed spacing
      let currentPosition = leftDecorative + studWidthMm + studGapMm;

      while (currentPosition + studWidthMm <= rightDecorative) {
        positions.push(currentPosition);
        currentPosition += onCenterSpacing;
      }
    } else if (leftDecorative !== undefined) {
      // Only left decorative - place studs from left decorative to end with FIXED spacing
      let currentPosition = leftDecorative + studWidthMm + studGapMm;

      while (currentPosition < endStudPosition) {
        positions.push(currentPosition);
        currentPosition += onCenterSpacing;
      }
    } else if (rightDecorative !== undefined) {
      // Only right decorative - place studs from start to right decorative with FIXED spacing
      let currentPosition = studWidthMm + studGapMm; // After first stud

      while (currentPosition + studWidthMm <= rightDecorative) {
        positions.push(currentPosition);
        currentPosition += onCenterSpacing;
      }
    }

    // Always place end stud - its left edge should be at (wallLength - studWidth)
    // so the stud ends exactly at wallLength
    if (wallLengthMm > studWidthMm) {
      const endStud = wallLengthMm - studWidthMm;
      if (!positions.includes(endStud)) {
        positions.push(endStud);
      }
    }

    // When startFromRight, also ensure we have a stud at position 0 (left edge)
    if (startFromRight && !positions.includes(0)) {
      positions.push(0);
    }

    return positions;
  }

  /**
   * Place decorative studs at offset positions from wall ends
   * NOTE: decorativeOffsetMm is edge-to-edge gap from wall edges
   * Returns LEFT EDGE positions (same convention as standard studs)
   * @param wallLengthMm Wall length in mm
   * @param decorativeOffsetMm Edge-to-edge offset from wall edges in mm
   * @param studWidthMm Stud width in mm (default 45)
   * @param decorativeSide Which side(s) to place decorative studs: 'both', 'left', 'right', or 'none'
   * @param startFromRight If true, reverse the meaning of left/right decoratives
   * @returns Array of decorative stud LEFT EDGE positions in mm
   */
  placeDecorativeStuds(
    wallLengthMm: number,
    decorativeOffsetMm: number,
    studWidthMm: number = 45,
    decorativeSide: "both" | "left" | "right" | "none" = "both",
    startFromRight: boolean = false,
  ): number[] {
    // Explicitly check: no decorative studs if offset is 0 or less, OR if side is 'none'
    if (
      !decorativeOffsetMm ||
      decorativeOffsetMm <= 0 ||
      decorativeSide === "none"
    ) {
      return [];
    }

    const positions: number[] = [];

    // Left decorative: gap from start stud right edge (at studWidthMm) to decorative left edge
    // Decorative left edge at: studWidthMm + decorativeOffsetMm
    const leftDecorativePosition = studWidthMm + decorativeOffsetMm;

    // Right decorative: gap from decorative right edge to end stud left edge
    // End stud left edge at: wallLengthMm - studWidthMm
    // Decorative right edge should be at: (wallLengthMm - studWidthMm) - decorativeOffsetMm
    // Decorative left edge at: (wallLengthMm - studWidthMm) - decorativeOffsetMm - studWidthMm
    const rightDecorativePosition =
      wallLengthMm - studWidthMm - decorativeOffsetMm - studWidthMm;

    // When startFromRight is true and decorativeSide is 'left' or 'right',
    // we need to place the decorative on the boundary side
    // For a right wall section: 'right' decorative should be on the far right (outer edge)
    // For a left wall section: 'left' decorative should be on the far left (outer edge)

    const effectiveSide =
      startFromRight && decorativeSide === "right"
        ? "right" // Place on right edge (outer boundary)
        : startFromRight && decorativeSide === "left"
          ? "both" // If left specified but startFromRight, allow both
          : decorativeSide;

    // Add left decorative if requested and doesn't overlap with right
    if (
      (effectiveSide === "both" || effectiveSide === "left") &&
      leftDecorativePosition + studWidthMm <= wallLengthMm / 2
    ) {
      positions.push(leftDecorativePosition);
    }

    // Add right decorative if requested and doesn't overlap with left
    if (
      (effectiveSide === "both" || effectiveSide === "right") &&
      rightDecorativePosition >= wallLengthMm / 2
    ) {
      positions.push(rightDecorativePosition);
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
   * Adjust stud heights by subtracting wall thickness (which accounts for plates)
   * @param studHeightMm Original stud height in mm
   * @param wallThicknessMm Wall thickness in mm (height of timber section)
   * @returns Adjusted stud height in mm
   */
  adjustStudHeightsForPlates(
    studHeightMm: number,
    wallThicknessMm: number,
  ): number {
    return studHeightMm - wallThicknessMm;
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
