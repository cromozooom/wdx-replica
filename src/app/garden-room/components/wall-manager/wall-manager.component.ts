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
   * Get stud layout for selected wall
   */
  get studLayout() {
    return this.store.studLayoutForWall()(this.selectedWallId);
  }
}
