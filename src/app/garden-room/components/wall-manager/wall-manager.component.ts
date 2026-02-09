import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { GardenRoomStore, updateWalls } from "../../store/garden-room.store";
import { Wall } from "../../models/wall.model";
import { StructuralCalculationService } from "../../services/structural-calculation.service";
import { STRUCTURAL_COLORS } from "../../constants/colors";

/**
 * WallManagerComponent - Configure wall dimensions and member layouts
 * Allows users to set wall length, stud gap, and decorative offsets
 */
@Component({
  selector: "app-wall-manager",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./wall-manager.component.html",
  styleUrls: ["./wall-manager.component.scss"],
})
export class WallManagerComponent {
  wallForm: FormGroup;

  // Structural element colors
  readonly colors = STRUCTURAL_COLORS;
  readonly store = inject(GardenRoomStore);
  private readonly structuralService = inject(StructuralCalculationService);
  selectedWallId = "front";

  // Expose timber sections from store
  get timberSections() {
    return this.store.materialLibrary().timberSections;
  }

  // Expose PIR boards from store
  get pirBoards() {
    return this.store.materialLibrary().pirBoards;
  }

  // Expose sheet materials from store
  get sheetMaterials() {
    return this.store.materialLibrary().sheetMaterials;
  }

  /**
   * Calculate the insulation area needed for the current wall (total wall area minus structural members)
   */
  get insulationAreaM2(): number {
    const walls = this.store.walls();
    const currentWall = walls.find((w) => w.id === this.selectedWallId);
    if (!currentWall) return 0;

    const totalWallArea =
      (currentWall.lengthMm / 1000) * (currentWall.heightMm / 1000); // Convert to m²

    // Calculate structural member areas
    let structuralArea = 0;

    // Calculate stud areas (vertical members)
    const studs = currentWall.members.filter(
      (m) => m.type === "stud" && m.metadata?.["subtype"] === "structural",
    );
    studs.forEach((stud) => {
      // Use stud width from wall configuration (assumes studs use wall stud width)
      const studWidthMm = currentWall.studWidthMm || 47;
      const studArea = (studWidthMm / 1000) * (stud.heightMm / 1000);
      structuralArea += studArea;
    });

    // Calculate plate areas (horizontal top and bottom)
    const topPlates = currentWall.members.filter(
      (m) => m.type === "plate" && m.metadata?.["position"] === "top",
    );
    const bottomPlates = currentWall.members.filter(
      (m) => m.type === "plate" && m.metadata?.["position"] === "bottom",
    );

    topPlates.forEach((plate) => {
      const plateArea =
        (plate.lengthMm / 1000) * (currentWall.plateThicknessTopMm / 1000);
      structuralArea += plateArea;
    });

    bottomPlates.forEach((plate) => {
      const plateArea =
        (plate.lengthMm / 1000) * (currentWall.plateThicknessBottomMm / 1000);
      structuralArea += plateArea;
    });

    // Calculate noggin areas (horizontal bracing)
    const noggins = currentWall.members.filter((m) => m.type === "noggin");
    noggins.forEach((noggin) => {
      // Use stud width for noggin width (same material)
      const nogginWidthMm = currentWall.studWidthMm || 47;
      const nogginArea = (noggin.lengthMm / 1000) * (nogginWidthMm / 1000);
      structuralArea += nogginArea;
    });

    // Return net insulation area (total wall area minus structural areas)
    return Math.max(0, totalWallArea - structuralArea);
  }

  /**
   * Get thickness (widthMm) from selected section
   */
  getThicknessFromSection(sectionId: string): number {
    const section = this.timberSections.find((s) => s.id === sectionId);
    return section ? section.widthMm : 47; // Default fallback to match 47x100-c24
  }

  /**
   * Get calculated thickness values for current form state
   */
  get calculatedThicknesses() {
    return {
      plateThicknessTopMm: this.getThicknessFromSection(
        this.wallForm.value.topPlateSection,
      ),
      plateThicknessBottomMm: this.getThicknessFromSection(
        this.wallForm.value.bottomPlateSection,
      ),
      studWidthMm: this.getThicknessFromSection(
        this.wallForm.value.studSection,
      ),
    };
  }

  constructor(private fb: FormBuilder) {
    this.wallForm = this.fb.group({
      lengthMm: [3000, [Validators.required, Validators.min(500)]],
      studGapMm: [400, [Validators.required, Validators.min(300)]],
      decorativeOffsetMm: [0, [Validators.required, Validators.min(0)]],
      decorativeSide: ["both"],
      topPlateSection: ["47x100-c24", [Validators.required]],
      bottomPlateSection: ["47x100-c24", [Validators.required]],
      studSection: ["47x100-c24", [Validators.required]],
      hasDoorOpening: [false],
      pillarWidthMm: [400, [Validators.required, Validators.min(50)]],
      leftWallWidthMm: [800, [Validators.required, Validators.min(300)]],
      doorSpaceWidthMm: [1000, [Validators.required, Validators.min(500)]],
      includeIrregularLastStud: [true],
      hasNoggins: [true],
      pirBoardId: [""],
      sheetMaterialId: [""],
    });

    // Track hasNoggins changes
    this.wallForm.controls["hasNoggins"].valueChanges.subscribe((value) => {
      console.log(
        "🔔 hasNoggins checkbox changed:",
        value,
        "for wall:",
        this.selectedWallId,
      );
    });

    // Load initial wall data
    this.loadWallData();

    // Track stud section changes specifically
    this.wallForm.controls["studSection"].valueChanges.subscribe((value) => {
      console.log(
        "🔧 studSection changed:",
        value,
        "calculated thickness:",
        this.getThicknessFromSection(value),
        "for wall:",
        this.selectedWallId,
      );
    });

    // Track PIR board changes
    this.wallForm.controls["pirBoardId"].valueChanges.subscribe((value) => {
      console.log(
        "🏠 pirBoardId changed:",
        value,
        "for wall:",
        this.selectedWallId,
      );
    });

    // Track sheet material changes
    this.wallForm.controls["sheetMaterialId"].valueChanges.subscribe(
      (value) => {
        console.log(
          "📋 sheetMaterialId changed:",
          value,
          "for wall:",
          this.selectedWallId,
        );
      },
    );

    // Sync form changes to store
    this.wallForm.valueChanges.subscribe(() => {
      console.log("📝 Form values changed:", {
        pirBoardId: this.wallForm.value.pirBoardId,
        sheetMaterialId: this.wallForm.value.sheetMaterialId,
        formValid: this.wallForm.valid,
      });
      if (this.wallForm.valid) {
        this.updateSelectedWall();
      }
    });
  }

  /**
   * Load wall data into form based on selected wall
   */
  loadWallData() {
    const wall = this.store.walls().find((w) => w.id === this.selectedWallId);
    if (wall) {
      // Find section IDs that match the current thickness values, or use defaults
      const topPlateSection =
        this.findSectionByThickness(wall.plateThicknessTopMm) || "47x100-c24";
      const bottomPlateSection =
        this.findSectionByThickness(wall.plateThicknessBottomMm) ||
        "47x100-c24";
      const studSection =
        this.findSectionByThickness(wall.studWidthMm || 47) || "47x100-c24";

      this.wallForm.patchValue({
        lengthMm: wall.lengthMm,
        studGapMm: wall.studGapMm,
        decorativeOffsetMm: wall.decorativeOffsetMm,
        decorativeSide: wall.decorativeSide || "both",
        topPlateSection: topPlateSection,
        bottomPlateSection: bottomPlateSection,
        studSection: studSection,
        hasDoorOpening: wall.hasDoorOpening || false,
        pillarWidthMm: wall.pillarWidthMm || 400,
        leftWallWidthMm: wall.leftWallWidthMm || 800,
        doorSpaceWidthMm: wall.doorSpaceWidthMm || 1000,
        includeIrregularLastStud: wall.includeIrregularLastStud ?? true,
        hasNoggins: wall.hasNoggins ?? true,
        pirBoardId: wall.pirBoardId || "",
        sheetMaterialId: wall.sheetMaterialId || "",
      });
    }
  }

  /**
   * Find section ID that matches the given thickness value
   */
  findSectionByThickness(thicknessMm: number): string | undefined {
    const section = this.timberSections.find((s) => s.widthMm === thicknessMm);
    return section?.id;
  }

  /**
   * Switch selected wall and load its data
   */
  selectWall(wallId: string) {
    this.selectedWallId = wallId;
    this.loadWallData();
  }

  /**
   * Update selected wall in store with form values
   */
  updateSelectedWall() {
    console.log(
      "🔄 updateSelectedWall called for wall:",
      this.selectedWallId,
      "hasNoggins:",
      this.wallForm.value.hasNoggins,
      "PIR:",
      this.wallForm.value.pirBoardId,
      "Sheet:",
      this.wallForm.value.sheetMaterialId,
    );

    // Calculate thickness values from selected sections
    const thicknesses = this.calculatedThicknesses;
    console.log("📏 Calculated thicknesses from sections:", {
      topPlateSection: this.wallForm.value.topPlateSection,
      bottomPlateSection: this.wallForm.value.bottomPlateSection,
      studSection: this.wallForm.value.studSection,
      calculatedThicknesses: thicknesses,
    });

    const walls = this.store.walls();
    const updatedWalls = walls.map((wall) => {
      if (wall.id === this.selectedWallId) {
        const updatedWall = {
          ...wall,
          lengthMm: this.wallForm.value.lengthMm,
          studGapMm: this.wallForm.value.studGapMm,
          decorativeOffsetMm: this.wallForm.value.decorativeOffsetMm,
          decorativeSide: this.wallForm.value.decorativeSide,
          plateThicknessTopMm: thicknesses.plateThicknessTopMm,
          plateThicknessBottomMm: thicknesses.plateThicknessBottomMm,
          studWidthMm: thicknesses.studWidthMm,
          hasDoorOpening: this.wallForm.value.hasDoorOpening,
          pillarWidthMm: this.wallForm.value.pillarWidthMm,
          leftWallWidthMm: this.wallForm.value.leftWallWidthMm,
          doorSpaceWidthMm: this.wallForm.value.doorSpaceWidthMm,
          includeIrregularLastStud:
            this.wallForm.value.includeIrregularLastStud,
          hasNoggins: this.wallForm.value.hasNoggins,
          pirBoardId: this.wallForm.value.pirBoardId || undefined,
          sheetMaterialId: this.wallForm.value.sheetMaterialId || undefined,
        };

        // Generate members from stud layout
        updatedWall.members = this.generateMembers(updatedWall);
        return updatedWall;
      }
      return wall;
    });
    updateWalls(this.store, updatedWalls);
  }

  /**
   * Generate Member objects from wall configuration
   */
  generateMembers(wall: any) {
    console.log(
      "🏗️ generateMembers called for wall:",
      wall.id,
      "hasNoggins:",
      wall.hasNoggins,
      "hasDoorOpening:",
      wall.hasDoorOpening,
    );
    const members: any[] = [];

    // Get stud layout for this wall
    const layout = this.store.studLayoutForWall()(wall.id);
    if (!layout) return members;

    // Get wall height based on wall name
    let wallHeight = this.store.frontWallHeightMm();
    if (wall.name === "Back") {
      wallHeight = this.store.backWallHeightMm();
    }

    // Handle door opening (4 sections for front wall)
    if (wall.hasDoorOpening && wall.name === "Front") {
      return this.generateMembersWithDoorOpening(wall, layout, wallHeight);
    }

    // Generate studs at resolved positions
    layout.resolvedStudPositionsMm.forEach((positionMm, index) => {
      members.push({
        id: `${wall.id}-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        heightMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        metadata: {},
      });
    });

    // Add bottom plate
    members.push({
      id: `${wall.id}-plate-bottom`,
      type: "plate",
      positionMm: 0,
      lengthMm: wall.lengthMm,
      heightMm: wall.plateThicknessBottomMm,
      metadata: { position: "bottom" },
    });

    // Add top plate
    members.push({
      id: `${wall.id}-plate-top`,
      type: "plate",
      positionMm: 0,
      lengthMm: wall.lengthMm,
      heightMm: wall.plateThicknessTopMm,
      metadata: { position: "top" },
    });

    // Add noggins between studs (simplified - one noggin per stud gap at mid-height)
    if (wall.hasNoggins) {
      console.log("✅ Entering noggin generation for regular wall:", wall.id);
      const studPositions = layout.resolvedStudPositionsMm.sort(
        (a, b) => a - b,
      );
      const studWidthMm = wall.studWidthMm || 45;
      console.log("🔧 Regular wall noggins generation:", {
        wallId: wall.id,
        studGapMm: wall.studGapMm,
        decorativeOffsetMm: wall.decorativeOffsetMm,
        studWidthMm: studWidthMm,
        studPositions: studPositions,
        wallObjectStudWidthMm: wall.studWidthMm, // Show what's actually in the wall object
      });
      for (let i = 0; i < studPositions.length - 1; i++) {
        const axisDistance = studPositions[i + 1] - studPositions[i];
        const actualGapWidth = axisDistance - studWidthMm; // Gap between stud edges, not centers
        const nogginStartPosition = studPositions[i] + studWidthMm / 2; // Right edge of left stud
        console.log(`  Noggin ${i}:`, {
          leftStudCenter: studPositions[i],
          rightStudCenter: studPositions[i + 1],
          axisDistance: axisDistance,
          actualGapWidth: actualGapWidth,
          nogginStartPosition: nogginStartPosition,
        });
        members.push({
          id: `${wall.id}-noggin-${i}`,
          type: "noggin",
          positionMm: nogginStartPosition, // Start at right edge of left stud
          lengthMm: actualGapWidth, // Actual gap width between stud edges
          heightMm: 45, // Standard noggin thickness
          metadata: { between: [studPositions[i], studPositions[i + 1]] },
        });
      }
    } else {
      console.log(
        "❌ Skipping noggins for regular wall:",
        wall.id,
        "(hasNoggins is false)",
      );
    }

    console.log(
      `📦 Regular wall ${wall.id} - Total members created:`,
      members.length,
    );
    console.log(`   Studs: ${members.filter((m) => m.type === "stud").length}`);
    console.log(
      `   Plates: ${members.filter((m) => m.type === "plate").length}`,
    );
    console.log(
      `   Noggins: ${members.filter((m) => m.type === "noggin").length}`,
    );
    members
      .filter((m) => m.type === "noggin")
      .forEach((n, i) => {
        console.log(
          `   Noggin ${i}: pos=${n.positionMm.toFixed(1)}mm, len=${n.lengthMm.toFixed(1)}mm`,
        );
      });

    return members;
  }

  /**
   * Generate members for wall with door opening (5 sections)
   * Sections: [Left Wall] [Left Pillar] [Door Space] [Right Pillar] [Right Wall]
   */
  private generateMembersWithDoorOpening(
    wall: any,
    layout: any,
    wallHeight: number,
  ) {
    const members: any[] = [];
    const pillarWidth = wall.pillarWidthMm || 400;
    const leftWallWidth = wall.leftWallWidthMm || 800;
    const doorSpaceWidth = wall.doorSpaceWidthMm || 1000;
    const studWidthMm = wall.studWidthMm || 45;
    const rightWallWidth =
      wall.lengthMm - leftWallWidth - 2 * pillarWidth - doorSpaceWidth;

    // Calculate section boundaries
    const leftWallEnd = leftWallWidth;
    const leftPillarEnd = leftWallEnd + pillarWidth;
    const doorSpaceEnd = leftPillarEnd + doorSpaceWidth;
    const rightPillarEnd = doorSpaceEnd + pillarWidth;
    // rightWallEnd = wall.lengthMm

    // Section 1: Left Wall (0 to leftWallWidth) - generate proper stud layout
    // Create a temporary wall object for left section
    const leftWallSection = {
      ...wall,
      lengthMm: leftWallWidth,
      decorativeSide: "left", // Decorative stud on left (outer) edge only
    };
    const leftWallLayout =
      this.structuralService.generateStudLayout(leftWallSection);

    leftWallLayout.resolvedStudPositionsMm.forEach(
      (positionMm: number, index: number) => {
        members.push({
          id: `${wall.id}-left-wall-stud-${index}`,
          type: "stud",
          positionMm, // Position is relative to left wall start (0)
          lengthMm:
            wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
          heightMm:
            wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
          metadata: { section: "left-wall" },
        });
      },
    );

    // Section 2: Left Pillar (leftWallWidth to leftPillarEnd)
    members.push({
      id: `${wall.id}-left-pillar`,
      type: "stud",
      positionMm: leftWallEnd,
      lengthMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      heightMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      metadata: { section: "left-pillar", width: pillarWidth },
    });

    // Section 3: Door Space (leftPillarEnd to doorSpaceEnd)
    // No studs in door opening

    // Section 4: Right Pillar (doorSpaceEnd to rightPillarEnd)
    members.push({
      id: `${wall.id}-right-pillar`,
      type: "stud",
      positionMm: doorSpaceEnd,
      lengthMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      heightMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      metadata: { section: "right-pillar", width: pillarWidth },
    });

    // Section 5: Right Wall (rightPillarEnd to wallLength) - generate proper stud layout
    // Create a temporary wall object for right section
    // IMPORTANT: Use startFromRight=true so studs start from the right edge (outer wall boundary)
    const rightWallSection = {
      ...wall,
      lengthMm: rightWallWidth,
      decorativeSide: "right", // Decorative stud on right (outer) edge only
    };
    const rightWallLayout = this.structuralService.generateStudLayout(
      rightWallSection,
      true, // startFromRight = true
    );

    rightWallLayout.resolvedStudPositionsMm.forEach(
      (relativePos: number, index: number) => {
        members.push({
          id: `${wall.id}-right-wall-stud-${index}`,
          type: "stud",
          positionMm: rightPillarEnd + relativePos, // Offset by right pillar end
          lengthMm:
            wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
          heightMm:
            wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
          metadata: { section: "right-wall" },
        });
      },
    );

    // Add plates for each section
    members.push(
      // Left wall plates
      {
        id: `${wall.id}-left-wall-plate-bottom`,
        type: "plate",
        positionMm: 0,
        lengthMm: leftWallWidth,
        heightMm: wall.plateThicknessBottomMm,
        metadata: { position: "bottom", section: "left-wall" },
      },
      {
        id: `${wall.id}-left-wall-plate-top`,
        type: "plate",
        positionMm: 0,
        lengthMm: leftWallWidth,
        heightMm: wall.plateThicknessTopMm,
        metadata: { position: "top", section: "left-wall" },
      },
      // Right wall plates
      {
        id: `${wall.id}-right-wall-plate-bottom`,
        type: "plate",
        positionMm: rightPillarEnd,
        lengthMm: rightWallWidth,
        heightMm: wall.plateThicknessBottomMm,
        metadata: { position: "bottom", section: "right-wall" },
      },
      {
        id: `${wall.id}-right-wall-plate-top`,
        type: "plate",
        positionMm: rightPillarEnd,
        lengthMm: rightWallWidth,
        heightMm: wall.plateThicknessTopMm,
        metadata: { position: "top", section: "right-wall" },
      },
    );

    // Add noggins for left and right wall sections
    if (wall.hasNoggins) {
      const studWidthMm = wall.studWidthMm || 45;
      // Add noggins for left wall
      const leftWallStuds = leftWallLayout.resolvedStudPositionsMm;
      const leftWallStudPositions = leftWallStuds.sort(
        (a: number, b: number) => a - b,
      );
      for (let i = 0; i < leftWallStudPositions.length - 1; i++) {
        const axisDistance =
          leftWallStudPositions[i + 1] - leftWallStudPositions[i];
        const actualGapWidth = axisDistance - studWidthMm;
        const nogginStartPosition = leftWallStudPositions[i] + studWidthMm / 2;
        members.push({
          id: `${wall.id}-left-wall-noggin-${i}`,
          type: "noggin",
          positionMm: nogginStartPosition,
          lengthMm: actualGapWidth,
          heightMm: 45,
          metadata: {
            section: "left-wall",
            between: [leftWallStudPositions[i], leftWallStudPositions[i + 1]],
          },
        });
      }

      // Add noggins for right wall
      const rightWallStuds = rightWallLayout.resolvedStudPositionsMm;
      const rightWallStudPositions = rightWallStuds.sort(
        (a: number, b: number) => a - b,
      );
      for (let i = 0; i < rightWallStudPositions.length - 1; i++) {
        const axisDistance =
          rightWallStudPositions[i + 1] - rightWallStudPositions[i];
        const actualGapWidth = axisDistance - studWidthMm;
        const nogginStartPosition = rightWallStudPositions[i] + studWidthMm / 2;
        const absolutePosition = rightPillarEnd + nogginStartPosition;
        members.push({
          id: `${wall.id}-right-wall-noggin-${i}`,
          type: "noggin",
          positionMm: absolutePosition,
          lengthMm: actualGapWidth,
          heightMm: 45,
          metadata: {
            section: "right-wall",
            between: [
              rightPillarEnd + rightWallStudPositions[i],
              rightPillarEnd + rightWallStudPositions[i + 1],
            ],
          },
        });
      }
    } else {
      console.log(
        "❌ Skipping noggins for door opening wall:",
        wall.id,
        "(hasNoggins is false)",
      );
    }

    console.log(
      `📦 Door opening wall ${wall.id} - Total members created:`,
      members.length,
    );
    console.log(`   Studs: ${members.filter((m) => m.type === "stud").length}`);
    console.log(
      `   Plates: ${members.filter((m) => m.type === "plate").length}`,
    );
    console.log(
      `   Pillars: ${members.filter((m) => m.type === "pillar").length}`,
    );
    console.log(
      `   Noggins: ${members.filter((m) => m.type === "noggin").length}`,
    );
    members
      .filter((m) => m.type === "noggin")
      .forEach((n, i) => {
        console.log(
          `   Noggin ${i}: pos=${n.positionMm.toFixed(1)}mm, len=${n.lengthMm.toFixed(1)}mm, section=${n.metadata?.["section"]}`,
        );
      });

    return members;
  }

  /**
   * Get current walls from store
   */
  get walls() {
    return this.store.walls();
  }

  /**
   * Get selected wall
   */
  get selectedWall(): Wall | undefined {
    return this.walls.find((w) => w.id === this.selectedWallId);
  }

  /**
   * Get calculated height for selected wall
   */
  get selectedWallHeight(): number {
    const wall = this.selectedWall;
    if (!wall) return 0;

    // Front wall uses frontWallHeightMm
    if (wall.name === "Front") {
      return this.store.frontWallHeightMm();
    }

    // Back wall uses backWallHeightMm
    if (wall.name === "Back") {
      return this.store.backWallHeightMm();
    }

    // Side walls need interpolated heights (simplified - use front height for now)
    // TODO: Implement side wall height interpolation from StructuralCalculationService
    return this.store.frontWallHeightMm();
  }

  /**
   * Get calculated right wall width for door opening (5 sections)
   * wallLength = leftWall + leftPillar + doorSpace + rightPillar + rightWall
   * rightWall = wallLength - leftWall - (2 * pillarWidth) - doorSpace
   */
  get rightWallWidthMm(): number {
    const lengthMm = this.wallForm.value.lengthMm || 0;
    const pillarWidthMm = this.wallForm.value.pillarWidthMm || 0;
    const leftWallWidthMm = this.wallForm.value.leftWallWidthMm || 0;
    const doorSpaceWidthMm = this.wallForm.value.doorSpaceWidthMm || 0;
    return lengthMm - leftWallWidthMm - 2 * pillarWidthMm - doorSpaceWidthMm;
  }

  /**
   * Get stud layout for selected wall
   */
  get studLayout() {
    return this.store.studLayoutForWall()(this.selectedWallId);
  }

  // SVG Preview dimensions and calculations
  readonly svgWidth = 800;
  readonly svgHeight = 600;
  readonly wallPadding = 50;

  get wallX(): number {
    return this.wallPadding;
  }

  get wallY(): number {
    return this.wallPadding;
  }

  get wallSvgWidth(): number {
    return this.svgWidth - 2 * this.wallPadding;
  }

  get wallSvgHeight(): number {
    return this.svgHeight - 2 * this.wallPadding;
  }

  get plateTopSvgHeight(): number {
    if (!this.selectedWall) return 0;
    const scale = this.wallSvgHeight / this.selectedWallHeight;
    return this.selectedWall.plateThicknessTopMm * scale;
  }

  get plateBottomSvgHeight(): number {
    if (!this.selectedWall) return 0;
    const scale = this.wallSvgHeight / this.selectedWallHeight;
    return this.selectedWall.plateThicknessBottomMm * scale;
  }

  get studSvgWidth(): number {
    if (!this.selectedWall) return 0;
    const studWidthMm = this.wallForm.value.studWidthMm || 45;
    const scale = this.wallSvgWidth / this.selectedWall.lengthMm;
    return studWidthMm * scale;
  }

  /**
   * Get validation status for wall selector buttons
   */
  get wallValidationStatus() {
    return this.walls.map((wall) => ({
      id: wall.id,
      name: wall.name,
      isValid: this.isWallValid(wall),
      errors: this.getWallErrors(wall),
    }));
  }

  /**
   * Check if a wall is fully configured and valid
   */
  isWallValid(wall: any): boolean {
    // Basic form validation
    if (!wall.lengthMm || wall.lengthMm < 500) return false;
    if (!wall.studGapMm || wall.studGapMm < 300) return false;
    if (wall.decorativeOffsetMm < 0) return false;

    // Material selection validation
    if (!wall.pirBoardId || wall.pirBoardId === "") return false;
    if (!wall.sheetMaterialId || wall.sheetMaterialId === "") return false;

    // Door opening validation (if applicable)
    if (wall.hasDoorOpening && wall.name === "Front") {
      if (!wall.pillarWidthMm || wall.pillarWidthMm < 50) return false;
      if (!wall.leftWallWidthMm || wall.leftWallWidthMm < 300) return false;
      if (!wall.doorSpaceWidthMm || wall.doorSpaceWidthMm < 500) return false;
    }

    return true;
  }

  /**
   * Get specific error messages for a wall
   */
  getWallErrors(wall: any): string[] {
    const errors: string[] = [];

    // Basic validation errors
    if (!wall.lengthMm || wall.lengthMm < 500) {
      errors.push("Wall length required (min 500mm)");
    }
    if (!wall.studGapMm || wall.studGapMm < 300) {
      errors.push("Stud gap required (min 300mm)");
    }
    if (wall.decorativeOffsetMm < 0) {
      errors.push("Decorative offset must be 0 or positive");
    }

    // Material selection errors
    if (!wall.pirBoardId || wall.pirBoardId === "") {
      errors.push("PIR board selection required");
    }
    if (!wall.sheetMaterialId || wall.sheetMaterialId === "") {
      errors.push("Sheet material selection required");
    }

    // Door opening errors
    if (wall.hasDoorOpening && wall.name === "Front") {
      if (!wall.pillarWidthMm || wall.pillarWidthMm < 50) {
        errors.push("Pillar width required (min 50mm)");
      }
      if (!wall.leftWallWidthMm || wall.leftWallWidthMm < 300) {
        errors.push("Left wall width required (min 300mm)");
      }
      if (!wall.doorSpaceWidthMm || wall.doorSpaceWidthMm < 500) {
        errors.push("Door space width required (min 500mm)");
      }
    }

    return errors;
  }

  /**
   * Get validation status for current form
   */
  get currentWallStatus() {
    const wall = this.selectedWall;
    if (!wall) return { isValid: false, errors: ["No wall selected"] };

    return {
      isValid: this.isWallValid(wall),
      errors: this.getWallErrors(wall),
    };
  }
}
