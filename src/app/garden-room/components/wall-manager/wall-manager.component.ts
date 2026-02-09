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
  readonly store = inject(GardenRoomStore);
  selectedWallId = "front";

  constructor(private fb: FormBuilder) {
    this.wallForm = this.fb.group({
      lengthMm: [3000, [Validators.required, Validators.min(500)]],
      studGapMm: [400, [Validators.required, Validators.min(300)]],
      decorativeOffsetMm: [0, [Validators.required, Validators.min(0)]],
      plateThicknessTopMm: [45, [Validators.required, Validators.min(20)]],
      plateThicknessBottomMm: [45, [Validators.required, Validators.min(20)]],
      hasDoorOpening: [false],
      pillarWidthMm: [100, [Validators.required, Validators.min(50)]],
      leftSectionWidthMm: [1000, [Validators.required, Validators.min(300)]],
    });

    // Load initial wall data
    this.loadWallData();

    // Sync form changes to store
    this.wallForm.valueChanges.subscribe(() => {
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
      this.wallForm.patchValue({
        lengthMm: wall.lengthMm,
        studGapMm: wall.studGapMm,
        decorativeOffsetMm: wall.decorativeOffsetMm,
        plateThicknessTopMm: wall.plateThicknessTopMm,
        plateThicknessBottomMm: wall.plateThicknessBottomMm,
        hasDoorOpening: wall.hasDoorOpening || false,
        pillarWidthMm: wall.pillarWidthMm || 100,
        leftSectionWidthMm: wall.leftSectionWidthMm || 1000,
      });
    }
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
    const walls = this.store.walls();
    const updatedWalls = walls.map((wall) => {
      if (wall.id === this.selectedWallId) {
        const updatedWall = {
          ...wall,
          lengthMm: this.wallForm.value.lengthMm,
          studGapMm: this.wallForm.value.studGapMm,
          decorativeOffsetMm: this.wallForm.value.decorativeOffsetMm,
          plateThicknessTopMm: this.wallForm.value.plateThicknessTopMm,
          plateThicknessBottomMm: this.wallForm.value.plateThicknessBottomMm,
          hasDoorOpening: this.wallForm.value.hasDoorOpening,
          pillarWidthMm: this.wallForm.value.pillarWidthMm,
          leftSectionWidthMm: this.wallForm.value.leftSectionWidthMm,
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
    const studPositions = layout.resolvedStudPositionsMm.sort((a, b) => a - b);
    for (let i = 0; i < studPositions.length - 1; i++) {
      const gapLength = studPositions[i + 1] - studPositions[i];
      members.push({
        id: `${wall.id}-noggin-${i}`,
        type: "noggin",
        positionMm: studPositions[i],
        lengthMm: gapLength,
        heightMm: 45, // Standard noggin thickness
        metadata: { between: [studPositions[i], studPositions[i + 1]] },
      });
    }

    return members;
  }

  /**
   * Generate members for wall with door opening (4 sections)
   */
  private generateMembersWithDoorOpening(
    wall: any,
    layout: any,
    wallHeight: number,
  ) {
    const members: any[] = [];
    const pillarWidth = wall.pillarWidthMm || 100;
    const leftSectionWidth = wall.leftSectionWidthMm || 1000;
    const rightSectionWidth =
      wall.lengthMm - 2 * pillarWidth - leftSectionWidth;

    // Section 1: Left full-height wall (0 to leftSectionWidth) with ONE decorative offset
    const leftStuds = layout.resolvedStudPositionsMm.filter(
      (pos: number) => pos >= wall.decorativeOffsetMm && pos < leftSectionWidth,
    );
    leftStuds.forEach((positionMm: number, index: number) => {
      members.push({
        id: `${wall.id}-left-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        heightMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        metadata: { section: "left-full-height" },
      });
    });

    // Section 2: Left pillar (leftSectionWidth to leftSectionWidth + pillarWidth)
    members.push({
      id: `${wall.id}-left-pillar`,
      type: "stud",
      positionMm: leftSectionWidth,
      lengthMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      heightMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      metadata: { section: "left-pillar", width: pillarWidth },
    });

    // Section 3: Right pillar (lengthMm - pillarWidth - rightSectionWidth to lengthMm - rightSectionWidth)
    const rightPillarPos = wall.lengthMm - pillarWidth - rightSectionWidth;
    members.push({
      id: `${wall.id}-right-pillar`,
      type: "stud",
      positionMm: rightPillarPos,
      lengthMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      heightMm:
        wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
      metadata: { section: "right-pillar", width: pillarWidth },
    });

    // Section 4: Right full-height wall (lengthMm - rightSectionWidth to lengthMm) with ONE decorative offset
    const rightSectionStart = wall.lengthMm - rightSectionWidth;
    const rightStuds = layout.resolvedStudPositionsMm.filter(
      (pos: number) =>
        pos >= rightSectionStart + wall.decorativeOffsetMm &&
        pos <= wall.lengthMm,
    );
    rightStuds.forEach((positionMm: number, index: number) => {
      members.push({
        id: `${wall.id}-right-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        heightMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        metadata: { section: "right-full-height" },
      });
    });

    // Add plates for each section
    members.push(
      // Left section plates
      {
        id: `${wall.id}-left-plate-bottom`,
        type: "plate",
        positionMm: 0,
        lengthMm: leftSectionWidth,
        heightMm: wall.plateThicknessBottomMm,
        metadata: { position: "bottom", section: "left" },
      },
      {
        id: `${wall.id}-left-plate-top`,
        type: "plate",
        positionMm: 0,
        lengthMm: leftSectionWidth,
        heightMm: wall.plateThicknessTopMm,
        metadata: { position: "top", section: "left" },
      },
      // Right section plates
      {
        id: `${wall.id}-right-plate-bottom`,
        type: "plate",
        positionMm: rightSectionStart,
        lengthMm: rightSectionWidth,
        heightMm: wall.plateThicknessBottomMm,
        metadata: { position: "bottom", section: "right" },
      },
      {
        id: `${wall.id}-right-plate-top`,
        type: "plate",
        positionMm: rightSectionStart,
        lengthMm: rightSectionWidth,
        heightMm: wall.plateThicknessTopMm,
        metadata: { position: "top", section: "right" },
      },
    );

    // Add noggins for left section
    const leftStudPositions = leftStuds.sort((a: number, b: number) => a - b);
    for (let i = 0; i < leftStudPositions.length - 1; i++) {
      const gapLength = leftStudPositions[i + 1] - leftStudPositions[i];
      members.push({
        id: `${wall.id}-left-noggin-${i}`,
        type: "noggin",
        positionMm: leftStudPositions[i],
        lengthMm: gapLength,
        heightMm: 45,
        metadata: {
          section: "left",
          between: [leftStudPositions[i], leftStudPositions[i + 1]],
        },
      });
    }

    // Add noggins for right section
    const rightStudPositions = rightStuds.sort((a: number, b: number) => a - b);
    for (let i = 0; i < rightStudPositions.length - 1; i++) {
      const gapLength = rightStudPositions[i + 1] - rightStudPositions[i];
      members.push({
        id: `${wall.id}-right-noggin-${i}`,
        type: "noggin",
        positionMm: rightStudPositions[i],
        lengthMm: gapLength,
        heightMm: 45,
        metadata: {
          section: "right",
          between: [rightStudPositions[i], rightStudPositions[i + 1]],
        },
      });
    }

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
   * Get calculated right section width for door opening
   */
  get rightSectionWidthMm(): number {
    const lengthMm = this.wallForm.value.lengthMm || 0;
    const pillarWidthMm = this.wallForm.value.pillarWidthMm || 0;
    const leftSectionWidthMm = this.wallForm.value.leftSectionWidthMm || 0;
    return lengthMm - 2 * pillarWidthMm - leftSectionWidthMm;
  }

  /**
   * Get stud layout for selected wall
   */
  get studLayout() {
    return this.store.studLayoutForWall()(this.selectedWallId);
  }
}
