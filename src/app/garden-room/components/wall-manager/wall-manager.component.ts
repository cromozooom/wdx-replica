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
        return {
          ...wall,
          lengthMm: this.wallForm.value.lengthMm,
          studGapMm: this.wallForm.value.studGapMm,
          decorativeOffsetMm: this.wallForm.value.decorativeOffsetMm,
          plateThicknessTopMm: this.wallForm.value.plateThicknessTopMm,
          plateThicknessBottomMm: this.wallForm.value.plateThicknessBottomMm,
        };
      }
      return wall;
    });
    updateWalls(this.store, updatedWalls);
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
   * Get stud layout for selected wall
   */
  get studLayout() {
    return this.store.studLayoutForWall()(this.selectedWallId);
  }
}
