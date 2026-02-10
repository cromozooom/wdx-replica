import { Component, inject, effect, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
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

  // Door Opening Default Configuration - adjust these values to change defaults
  private readonly DEFAULT_PILLAR_WIDTH_MM = 400;
  private readonly DEFAULT_LEFT_WALL_WIDTH_MM = 1000;
  private readonly DEFAULT_DOOR_SPACE_WIDTH_MM = 2400;

  // Structural element colors
  readonly colors = STRUCTURAL_COLORS;
  readonly store = inject(GardenRoomStore);
  private readonly structuralService = inject(StructuralCalculationService);
  selectedWallId = signal("front");

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
   * Calculate detailed area breakdown for the current wall
   */
  get wallAreaBreakdown(): any {
    const walls = this.store.walls();
    const currentWall = walls.find((w) => w.id === this.selectedWallId());
    if (!currentWall) return null;

    const wallHeightMm = this.selectedWallHeight;
    const totalGrossArea =
      (currentWall.lengthMm / 1000) * (wallHeightMm / 1000);

    // Handle door opening walls differently
    if (currentWall.hasDoorOpening && currentWall.name === "Front") {
      return this.calculateDoorOpeningAreaBreakdown(
        currentWall,
        wallHeightMm,
        totalGrossArea,
      );
    }

    // Regular wall calculation
    return this.calculateRegularWallAreaBreakdown(
      currentWall,
      wallHeightMm,
      totalGrossArea,
    );
  }

  /**
   * Calculate area breakdown for walls with door openings
   */
  private calculateDoorOpeningAreaBreakdown(
    wall: any,
    wallHeightMm: number,
    totalGrossArea: number,
  ): any {
    const pillarWidthMm = wall.pillarWidthMm || this.DEFAULT_PILLAR_WIDTH_MM;
    const leftWallWidthMm =
      wall.leftWallWidthMm || this.DEFAULT_LEFT_WALL_WIDTH_MM;
    const doorSpaceWidthMm =
      wall.doorSpaceWidthMm || this.DEFAULT_DOOR_SPACE_WIDTH_MM;
    const rightWallWidthMm =
      wall.lengthMm - leftWallWidthMm - 2 * pillarWidthMm - doorSpaceWidthMm;

    // Calculate areas for each section
    const leftWallArea = (leftWallWidthMm / 1000) * (wallHeightMm / 1000);
    const leftPillarArea = (pillarWidthMm / 1000) * (wallHeightMm / 1000);
    const doorOpeningArea = (doorSpaceWidthMm / 1000) * (wallHeightMm / 1000);
    const rightPillarArea = (pillarWidthMm / 1000) * (wallHeightMm / 1000);
    const rightWallArea = (rightWallWidthMm / 1000) * (wallHeightMm / 1000);

    // Calculate structural areas
    const structuralAreaBreakdown = this.calculateStructuralAreas(wall);

    // Net framed area (excludes door opening but includes pillars)
    const netFramedArea =
      leftWallArea + leftPillarArea + rightPillarArea + rightWallArea;

    // Insulation area calculation:
    // Insulation fits BETWEEN studs/noggins, so we only subtract plate heights
    const plateHeightMm = wall.wallThicknessMm || 100;
    const netInsulationHeight = wallHeightMm - plateHeightMm;
    const netInsulationArea =
      ((wall.lengthMm - doorSpaceWidthMm) / 1000) *
      (netInsulationHeight / 1000);

    return {
      type: "door-opening",
      totalGrossArea,
      sections: {
        leftWall: { widthMm: leftWallWidthMm, area: leftWallArea },
        leftPillar: { widthMm: pillarWidthMm, area: leftPillarArea },
        doorOpening: { widthMm: doorSpaceWidthMm, area: doorOpeningArea },
        rightPillar: { widthMm: pillarWidthMm, area: rightPillarArea },
        rightWall: { widthMm: rightWallWidthMm, area: rightWallArea },
      },
      netFramedArea,
      doorOpeningArea,
      structuralAreaBreakdown,
      netInsulationArea,
      areaReduction: doorOpeningArea,
    };
  }

  /**
   * Calculate area breakdown for regular walls (no door opening)
   */
  private calculateRegularWallAreaBreakdown(
    wall: any,
    wallHeightMm: number,
    totalGrossArea: number,
  ): any {
    const structuralAreaBreakdown = this.calculateStructuralAreas(wall);

    // Insulation area calculation:
    // Insulation fits BETWEEN studs and noggins, so we only subtract plate heights
    const plateHeightMm = wall.wallThicknessMm || 100;
    const netInsulationHeight = wallHeightMm - plateHeightMm;
    const netInsulationArea =
      (wall.lengthMm / 1000) * (netInsulationHeight / 1000);

    return {
      type: "regular",
      totalGrossArea,
      structuralAreaBreakdown,
      netInsulationArea,
      plateHeightReduction: plateHeightMm,
      areaReduction: 0,
    };
  }

  /**
   * Calculate structural member areas (studs, plates, noggins)
   */
  private calculateStructuralAreas(wall: any): any {
    let studArea = 0;
    let plateArea = 0;
    let nogginArea = 0;

    // Calculate stud areas
    const studs = wall.members.filter((m: any) => m.type === "stud");
    studs.forEach((stud: any) => {
      const studWidthMm = wall.studWidthMm || 47;
      studArea += (studWidthMm / 1000) * (stud.heightMm / 1000);
    });

    // Calculate plate areas
    const plates = wall.members.filter((m: any) => m.type === "plate");
    plates.forEach((plate: any) => {
      const thickness = (wall.wallThicknessMm || 100) / 2; // Each plate is half of wall thickness
      plateArea += (plate.lengthMm / 1000) * (thickness / 1000);
    });

    // Calculate noggin areas
    const noggins = wall.members.filter((m: any) => m.type === "noggin");
    noggins.forEach((noggin: any) => {
      const nogginWidthMm = wall.studWidthMm || 47;
      nogginArea += (noggin.lengthMm / 1000) * (nogginWidthMm / 1000);
    });

    return {
      studArea,
      plateArea,
      nogginArea,
      totalStructuralArea: studArea + plateArea + nogginArea,
    };
  }

  /**
   * Calculate the insulation area needed for the current wall (total wall area minus structural members)
   */
  get insulationAreaM2(): number {
    const breakdown = this.wallAreaBreakdown;
    return breakdown ? breakdown.netInsulationArea : 0;
  }

  /**
   * Get thickness (heightMm) from selected section
   * For timber notation like 47x150, returns the height dimension (150)
   * Used for plates (horizontal members)
   */
  getThicknessFromSection(sectionId: string): number {
    const section = this.timberSections.find((s) => s.id === sectionId);
    return section ? section.heightMm : 100; // Default fallback to 100mm
  }

  /**
   * Get width (widthMm) from selected section
   * For timber notation like 47x150, returns the width dimension (47)
   * Used for studs (vertical members) to determine spacing
   */
  getWidthFromSection(sectionId: string): number {
    const section = this.timberSections.find((s) => s.id === sectionId);
    return section ? section.widthMm : 47; // Default fallback to 47mm
  }

  /**
   * Get calculated thickness values for current form state
   */
  get calculatedThicknesses() {
    const timberSection = this.wallForm.value.timberSection || "47x100-c24";
    const wallThickness = this.getThicknessFromSection(timberSection);

    return {
      wallThicknessMm: wallThickness,
      studWidthMm: this.getWidthFromSection(timberSection),
      plateThicknessMm: wallThickness, // Same for all plates
      roofFrontExtensionMm: this.wallForm.value.roofFrontExtensionMm,
      roofBackExtensionMm: this.wallForm.value.roofBackExtensionMm,
    };
  }

  constructor(private fb: FormBuilder) {
    this.wallForm = this.fb.group({
      lengthMm: [3000, [Validators.required, Validators.min(500)]],
      studGapMm: [400, [Validators.required, Validators.min(300)]],
      decorativeOffsetMm: [0, [Validators.required, Validators.min(0)]],
      decorativeSide: ["both"],
      timberSection: ["47x100-c24", [Validators.required]], // Single section for ALL structural members
      hasDoorOpening: [false],
      pillarWidthMm: [
        this.DEFAULT_PILLAR_WIDTH_MM,
        [Validators.required, Validators.min(50)],
      ],
      leftWallWidthMm: [
        this.DEFAULT_LEFT_WALL_WIDTH_MM,
        [Validators.required, Validators.min(300)],
      ],
      doorSpaceWidthMm: [
        this.DEFAULT_DOOR_SPACE_WIDTH_MM,
        [Validators.required, Validators.min(500)],
      ],
      includeIrregularLastStud: [true],
      hasNoggins: [true],
      pirBoardId: [this.pirBoards[0]?.id || ""],
      sheetMaterialId: [this.sheetMaterials[0]?.id || ""],
      roofFrontExtensionMm: [100, [Validators.required, Validators.min(0)]],
      roofBackExtensionMm: [100, [Validators.required, Validators.min(0)]],
    });

    // Load initial wall data
    this.loadWallData();

    // Setup reactive effects for immediate updates
    this.setupReactiveEffects();
  }

  /**
   * Setup reactive effects for immediate form updates
   */
  private setupReactiveEffects() {
    // Single subscription for all form changes with debouncing
    this.wallForm.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((formValues) => {
        console.log("🔄 Form values changed:", {
          timberSection: formValues.timberSection,
          studWidthMm: this.getWidthFromSection(formValues.timberSection),
          wallId: this.selectedWallId(),
        });
        // Always update, even if invalid - let validation errors show but still calculate
        this.updateSelectedWall();
      });

    // Effect for reactive wall selection changes
    effect(() => {
      const wallId = this.selectedWallId();
      this.loadWallData();
    });
  }

  /**
   * Load wall data into form based on selected wall
   */
  loadWallData() {
    const walls = this.store.walls();
    const selectedWall = walls.find((w) => w.id === this.selectedWallId());
    if (selectedWall) {
      // Find section that matches current values, or use stored section as fallback
      const timberSection =
        selectedWall.timberSection ||
        selectedWall.studSection || // Legacy fallback
        this.findSectionByWidth(selectedWall.studWidthMm || 47) ||
        "47x100-c24";

      console.log("🔃 Loading wall data from store:", {
        wallId: selectedWall.id,
        studWidthMm: selectedWall.studWidthMm,
        storedTimberSection: selectedWall.timberSection,
        finalTimberSection: timberSection,
      });

      this.wallForm.patchValue(
        {
          lengthMm: selectedWall.lengthMm,
          studGapMm: selectedWall.studGapMm,
          decorativeOffsetMm: selectedWall.decorativeOffsetMm,
          decorativeSide: selectedWall.decorativeSide || "both",
          timberSection: timberSection,
          hasDoorOpening: selectedWall.hasDoorOpening || false,
          pillarWidthMm:
            selectedWall.pillarWidthMm || this.DEFAULT_PILLAR_WIDTH_MM,
          leftWallWidthMm:
            selectedWall.leftWallWidthMm || this.DEFAULT_LEFT_WALL_WIDTH_MM,
          doorSpaceWidthMm:
            selectedWall.doorSpaceWidthMm || this.DEFAULT_DOOR_SPACE_WIDTH_MM,
          includeIrregularLastStud:
            selectedWall.includeIrregularLastStud ?? true,
          hasNoggins: selectedWall.hasNoggins ?? true,
          pirBoardId: selectedWall.pirBoardId || this.pirBoards[0]?.id || "",
          sheetMaterialId:
            selectedWall.sheetMaterialId || this.sheetMaterials[0]?.id || "",
          roofFrontExtensionMm: selectedWall.roofFrontExtensionMm || 100,
          roofBackExtensionMm: selectedWall.roofBackExtensionMm || 100,
        },
        { emitEvent: false },
      );

      // If the wall didn't have materials set, update the store with defaults
      if (!selectedWall.pirBoardId || !selectedWall.sheetMaterialId) {
        // Use setTimeout to avoid effect loop - update store after current cycle
        setTimeout(() => this.updateSelectedWall(), 0);
      }
    }
  }

  /**
   * Find section ID that matches the given thickness value
   * Note: thickness refers to the height dimension (e.g., 150mm in 47x150)
   */
  /**
   * Find timber section by thickness (heightMm)
   * Used for plates (horizontal members)
   */
  findSectionByThickness(thicknessMm: number): string | undefined {
    const section = this.timberSections.find((s) => s.heightMm === thicknessMm);
    return section?.id;
  }

  /**
   * Find timber section by width (widthMm)
   * Used for studs (vertical members)
   */
  findSectionByWidth(widthMm: number): string | undefined {
    const section = this.timberSections.find((s) => s.widthMm === widthMm);
    console.log("🔍 Finding section by width:", {
      searchWidthMm: widthMm,
      foundSection: section?.id,
      availableSections: this.timberSections.map(
        (s) => `${s.id}(${s.widthMm}x${s.heightMm})`,
      ),
    });
    return section?.id;
  }

  /**
   * Switch selected wall and load its data
   */
  selectWall(wallId: string) {
    this.selectedWallId.set(wallId);
    // loadWallData will be called automatically via effect
  }

  /**
   * Update selected wall in store with form values
   */
  updateSelectedWall() {
    // Calculate thickness values from selected sections
    const thicknesses = this.calculatedThicknesses;

    console.log("📝 Updating wall in store:", {
      wallId: this.selectedWallId(),
      formTimberSection: this.wallForm.value.timberSection,
      calculatedStudWidth: thicknesses.studWidthMm,
      calculatedWallThickness: thicknesses.wallThicknessMm,
      formValid: this.wallForm.valid,
    });

    const walls = this.store.walls();
    const updatedWalls = walls.map((wall) => {
      if (wall.id === this.selectedWallId()) {
        const updatedWall = {
          ...wall,
          lengthMm: this.wallForm.value.lengthMm,
          studGapMm: this.wallForm.value.studGapMm,
          decorativeOffsetMm: this.wallForm.value.decorativeOffsetMm,
          decorativeSide: this.wallForm.value.decorativeSide,
          timberSection: this.wallForm.value.timberSection,
          wallThicknessMm: thicknesses.wallThicknessMm,
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
          roofFrontExtensionMm: this.wallForm.value.roofFrontExtensionMm,
          roofBackExtensionMm: this.wallForm.value.roofBackExtensionMm,
        };

        // Generate members from stud layout
        updatedWall.members = this.generateMembers(updatedWall);

        console.log("✅ Wall updated in store:", {
          wallId: updatedWall.id,
          timberSection: updatedWall.timberSection,
          studWidthMm: updatedWall.studWidthMm,
          wallThicknessMm: updatedWall.wallThicknessMm,
          memberCount: updatedWall.members.length,
          sampleMemberSections: updatedWall.members.slice(0, 3).map((m) => ({
            type: m.type,
            sectionName: m.sectionName,
            lengthMm: m.lengthMm,
          })),
          allMemberSections: updatedWall.members.map((m) => m.sectionName),
        });

        return updatedWall;
      }
      return wall;
    });
    updateWalls(this.store, updatedWalls);

    // Immediate verification of store update
    const verifyUpdate = this.store.walls();
    const updatedWall = verifyUpdate.find(
      (w) => w.id === this.selectedWallId(),
    );
    console.log("🔍 Store update verification:", {
      wallId: this.selectedWallId(),
      formTimberSection: this.wallForm.value.timberSection,
      storeTimberSection: updatedWall?.timberSection,
      updateSuccessful:
        this.wallForm.value.timberSection === updatedWall?.timberSection,
    });
  }

  /**
   * Generate Member objects from wall configuration
   */
  generateMembers(wall: any) {
    const members: any[] = [];

    console.log("🔧 Generating members for wall:", {
      wallId: wall.id,
      wallTimberSection: wall.timberSection,
      wallName: wall.name,
    });

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
      const studMember = {
        id: `${wall.id}-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm: wallHeight - (wall.wallThicknessMm || 100),
        heightMm: wallHeight - (wall.wallThicknessMm || 100),
        sectionName: wall.timberSection || "47x100-c24",
        metadata: {},
      };

      if (index === 0) {
        console.log("🪵 Creating first stud with section:", {
          wallTimberSection: wall.timberSection,
          assignedSectionName: studMember.sectionName,
          memberId: studMember.id,
        });
      }

      members.push(studMember);
    });

    // Add bottom plate
    const bottomPlate = {
      id: `${wall.id}-plate-bottom`,
      type: "plate",
      positionMm: 0,
      lengthMm: wall.lengthMm,
      heightMm: (wall.wallThicknessMm || 100) / 2, // Half of total wall thickness
      sectionName: wall.timberSection || "47x100-c24",
      metadata: { position: "bottom" },
    };

    console.log("🟫 Creating bottom plate with section:", {
      wallTimberSection: wall.timberSection,
      assignedSectionName: bottomPlate.sectionName,
      plateLength: bottomPlate.lengthMm,
    });

    members.push(bottomPlate);

    // Add top plate
    const topPlate = {
      id: `${wall.id}-plate-top`,
      type: "plate",
      positionMm: 0,
      lengthMm: wall.lengthMm,
      heightMm: (wall.wallThicknessMm || 100) / 2, // Half of total wall thickness
      sectionName: wall.timberSection || "47x100-c24",
      metadata: { position: "top" },
    };

    console.log("🔝 Creating top plate with section:", {
      wallTimberSection: wall.timberSection,
      assignedSectionName: topPlate.sectionName,
      plateLength: topPlate.lengthMm,
    });

    members.push(topPlate);

    // Add noggins between studs (simplified - one noggin per stud gap at mid-height)
    if (wall.hasNoggins) {
      const studPositions = layout.resolvedStudPositionsMm.sort(
        (a, b) => a - b,
      );
      const studWidthMm = wall.studWidthMm || 45;
      for (let i = 0; i < studPositions.length - 1; i++) {
        const axisDistance = studPositions[i + 1] - studPositions[i];
        const actualGapWidth = axisDistance - studWidthMm; // Gap between stud edges
        const nogginStartPosition = studPositions[i] + studWidthMm; // Right edge of left stud
        members.push({
          id: `${wall.id}-noggin-${i}`,
          type: "noggin",
          positionMm: nogginStartPosition, // Start at right edge of left stud
          lengthMm: actualGapWidth, // Actual gap width between stud edges
          heightMm: 45, // Standard noggin thickness
          metadata: { between: [studPositions[i], studPositions[i + 1]] },
        });
      }
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
    const pillarWidth = wall.pillarWidthMm || this.DEFAULT_PILLAR_WIDTH_MM;
    const leftWallWidth =
      wall.leftWallWidthMm || this.DEFAULT_LEFT_WALL_WIDTH_MM;
    const doorSpaceWidth =
      wall.doorSpaceWidthMm || this.DEFAULT_DOOR_SPACE_WIDTH_MM;
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
          lengthMm: wallHeight - (wall.wallThicknessMm || 100),
          heightMm: wallHeight - (wall.wallThicknessMm || 100),
          sectionName: wall.timberSection || "47x100-c24",
          metadata: { section: "left-wall" },
        });
      },
    );

    // Section 2: Left Pillar (leftWallWidth to leftPillarEnd)
    members.push({
      id: `${wall.id}-left-pillar`,
      type: "stud",
      positionMm: leftWallEnd,
      lengthMm: wallHeight - (wall.wallThicknessMm || 100),
      heightMm: wallHeight - (wall.wallThicknessMm || 100),
      sectionName: wall.timberSection || "47x100-c24",
      metadata: { section: "left-pillar", width: pillarWidth },
    });

    // Section 3: Door Space (leftPillarEnd to doorSpaceEnd)
    // No studs in door opening

    // Section 4: Right Pillar (doorSpaceEnd to rightPillarEnd)
    members.push({
      id: `${wall.id}-right-pillar`,
      type: "stud",
      positionMm: doorSpaceEnd,
      lengthMm: wallHeight - (wall.wallThicknessMm || 100),
      heightMm: wallHeight - (wall.wallThicknessMm || 100),
      sectionName: wall.timberSection || "47x100-c24",
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
          lengthMm: wallHeight - (wall.wallThicknessMm || 100),
          heightMm: wallHeight - (wall.wallThicknessMm || 100),
          sectionName: wall.timberSection || "47x100-c24",
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
        heightMm: (wall.wallThicknessMm || 100) / 2,
        sectionName: wall.timberSection || "47x100-c24",
        metadata: { position: "bottom", section: "left-wall" },
      },
      {
        id: `${wall.id}-left-wall-plate-top`,
        type: "plate",
        positionMm: 0,
        lengthMm: leftWallWidth,
        heightMm: (wall.wallThicknessMm || 100) / 2,
        sectionName: wall.timberSection || "47x100-c24",
        metadata: { position: "top", section: "left-wall" },
      },
      // Right wall plates
      {
        id: `${wall.id}-right-wall-plate-bottom`,
        type: "plate",
        positionMm: rightPillarEnd,
        lengthMm: rightWallWidth,
        heightMm: (wall.wallThicknessMm || 100) / 2,
        sectionName: wall.timberSection || "47x100-c24",
        metadata: { position: "bottom", section: "right-wall" },
      },
      {
        id: `${wall.id}-right-wall-plate-top`,
        type: "plate",
        positionMm: rightPillarEnd,
        lengthMm: rightWallWidth,
        heightMm: (wall.wallThicknessMm || 100) / 2,
        sectionName: wall.timberSection || "47x100-c24",
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
        const nogginStartPosition = leftWallStudPositions[i] + studWidthMm;
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
        const nogginStartPosition = rightWallStudPositions[i] + studWidthMm;
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
    return this.walls.find((w) => w.id === this.selectedWallId());
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
    return this.store.studLayoutForWall()(this.selectedWallId());
  }

  // Helper getters for all walls (for overview diagram)
  get frontWall() {
    return this.walls.find((w) => w.name === "Front");
  }

  get backWall() {
    return this.walls.find((w) => w.name === "Back");
  }

  get leftWall() {
    return this.walls.find((w) => w.name === "Left");
  }

  get rightWall() {
    return this.walls.find((w) => w.name === "Right");
  }

  get roofWall() {
    return this.walls.find((w) => w.name === "Roof");
  }

  get baseWall() {
    return this.walls.find((w) => w.name === "Base");
  }

  get frontWallHeight() {
    return this.store.frontWallHeightMm();
  }

  get backWallHeight() {
    return this.store.backWallHeightMm();
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
    return ((this.selectedWall.wallThicknessMm || 100) / 2) * scale;
  }

  get plateBottomSvgHeight(): number {
    if (!this.selectedWall) return 0;
    const scale = this.wallSvgHeight / this.selectedWallHeight;
    return ((this.selectedWall.wallThicknessMm || 100) / 2) * scale;
  }

  get studSvgWidth(): number {
    if (!this.selectedWall) return 0;
    const studWidthMm = this.selectedWall.studWidthMm || 47;
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

      // Validate wall is large enough for door opening sections
      const pillarWidthMm = wall.pillarWidthMm || this.DEFAULT_PILLAR_WIDTH_MM;
      const leftWallWidthMm =
        wall.leftWallWidthMm || this.DEFAULT_LEFT_WALL_WIDTH_MM;
      const doorSpaceWidthMm =
        wall.doorSpaceWidthMm || this.DEFAULT_DOOR_SPACE_WIDTH_MM;
      const requiredLength =
        leftWallWidthMm + 2 * pillarWidthMm + doorSpaceWidthMm;
      const rightWallWidth = wall.lengthMm - requiredLength;

      if (rightWallWidth < 300) {
        const minRequired =
          leftWallWidthMm + 2 * pillarWidthMm + doorSpaceWidthMm + 300;
        errors.push(
          `Wall too short for door opening. Current: ${wall.lengthMm}mm, Minimum required: ${minRequired}mm (left ${leftWallWidthMm}mm + pillars ${2 * pillarWidthMm}mm + door ${doorSpaceWidthMm}mm + right wall min 300mm)`,
        );
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
