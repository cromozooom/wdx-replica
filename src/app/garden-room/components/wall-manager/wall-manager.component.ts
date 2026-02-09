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
      decorativeSide: ["both"],
      plateThicknessTopMm: [45, [Validators.required, Validators.min(20)]],
      plateThicknessBottomMm: [45, [Validators.required, Validators.min(20)]],
      hasDoorOpening: [false],
      pillarWidthMm: [400, [Validators.required, Validators.min(50)]],
      leftWallWidthMm: [800, [Validators.required, Validators.min(300)]],
      doorSpaceWidthMm: [1000, [Validators.required, Validators.min(500)]],
      studWidthMm: [
        45,
        [Validators.required, Validators.min(20), Validators.max(100)],
      ],
      includeIrregularLastStud: [true],
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
        decorativeSide: wall.decorativeSide || "both",
        plateThicknessTopMm: wall.plateThicknessTopMm,
        plateThicknessBottomMm: wall.plateThicknessBottomMm,
        hasDoorOpening: wall.hasDoorOpening || false,
        pillarWidthMm: wall.pillarWidthMm || 400,
        leftWallWidthMm: wall.leftWallWidthMm || 800,
        doorSpaceWidthMm: wall.doorSpaceWidthMm || 1000,
        studWidthMm: wall.studWidthMm || 45,
        includeIrregularLastStud: wall.includeIrregularLastStud ?? true,
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
          decorativeSide: this.wallForm.value.decorativeSide,
          plateThicknessTopMm: this.wallForm.value.plateThicknessTopMm,
          plateThicknessBottomMm: this.wallForm.value.plateThicknessBottomMm,
          hasDoorOpening: this.wallForm.value.hasDoorOpening,
          pillarWidthMm: this.wallForm.value.pillarWidthMm,
          leftWallWidthMm: this.wallForm.value.leftWallWidthMm,
          doorSpaceWidthMm: this.wallForm.value.doorSpaceWidthMm,
          studWidthMm: this.wallForm.value.studWidthMm,
          includeIrregularLastStud:
            this.wallForm.value.includeIrregularLastStud,
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
    const rightWallWidth =
      wall.lengthMm - leftWallWidth - 2 * pillarWidth - doorSpaceWidth;

    // Calculate section boundaries
    const leftWallEnd = leftWallWidth;
    const leftPillarEnd = leftWallEnd + pillarWidth;
    const doorSpaceEnd = leftPillarEnd + doorSpaceWidth;
    const rightPillarEnd = doorSpaceEnd + pillarWidth;
    // rightWallEnd = wall.lengthMm

    // Section 1: Left Wall (0 to leftWallWidth) - decorative stud only on LEFT
    // This wall needs its own stud layout with decorativeSide='left'
    const leftWallStuds = layout.resolvedStudPositionsMm.filter(
      (pos: number) => pos >= 0 && pos < leftWallEnd,
    );
    leftWallStuds.forEach((positionMm: number, index: number) => {
      members.push({
        id: `${wall.id}-left-wall-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        heightMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        metadata: { section: "left-wall" },
      });
    });

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

    // Section 5: Right Wall (rightPillarEnd to wallLength) - decorative stud only on RIGHT
    // This wall needs its own stud layout with decorativeSide='right'
    const rightWallStuds = layout.resolvedStudPositionsMm.filter(
      (pos: number) => pos >= rightPillarEnd && pos <= wall.lengthMm,
    );
    rightWallStuds.forEach((positionMm: number, index: number) => {
      members.push({
        id: `${wall.id}-right-wall-stud-${index}`,
        type: "stud",
        positionMm,
        lengthMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        heightMm:
          wallHeight - wall.plateThicknessTopMm - wall.plateThicknessBottomMm,
        metadata: { section: "right-wall" },
      });
    });

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

    // Add noggins for left wall
    const leftWallStudPositions = leftWallStuds.sort(
      (a: number, b: number) => a - b,
    );
    for (let i = 0; i < leftWallStudPositions.length - 1; i++) {
      const gapLength = leftWallStudPositions[i + 1] - leftWallStudPositions[i];
      members.push({
        id: `${wall.id}-left-wall-noggin-${i}`,
        type: "noggin",
        positionMm: leftWallStudPositions[i],
        lengthMm: gapLength,
        heightMm: 45,
        metadata: {
          section: "left-wall",
          between: [leftWallStudPositions[i], leftWallStudPositions[i + 1]],
        },
      });
    }

    // Add noggins for right wall
    const rightWallStudPositions = rightWallStuds.sort(
      (a: number, b: number) => a - b,
    );
    for (let i = 0; i < rightWallStudPositions.length - 1; i++) {
      const gapLength =
        rightWallStudPositions[i + 1] - rightWallStudPositions[i];
      members.push({
        id: `${wall.id}-right-wall-noggin-${i}`,
        type: "noggin",
        positionMm: rightWallStudPositions[i],
        lengthMm: gapLength,
        heightMm: 45,
        metadata: {
          section: "right-wall",
          between: [rightWallStudPositions[i], rightWallStudPositions[i + 1]],
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
}
