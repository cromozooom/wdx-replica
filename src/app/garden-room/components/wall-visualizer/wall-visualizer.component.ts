import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GardenRoomStore } from "../../store/garden-room.store";
import { Wall } from "../../models/wall.model";

/**
 * WallVisualizerComponent - SVG-based wall preview
 * Displays wall members visually with real-time updates
 */
@Component({
  selector: "app-wall-visualizer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./wall-visualizer.component.html",
  styleUrls: ["./wall-visualizer.component.scss"],
})
export class WallVisualizerComponent {
  @Input() wallId = "front";
  readonly store = inject(GardenRoomStore);

  // SVG viewport dimensions
  readonly viewBoxWidth = 800;
  readonly viewBoxHeight = 600;
  readonly padding = 50;

  /**
   * Get wall from store
   */
  get wall(): Wall | undefined {
    return this.store.walls().find((w) => w.id === this.wallId);
  }

  /**
   * Get stud layout for wall
   */
  get studLayout() {
    return this.store.studLayoutForWall()(this.wallId);
  }

  /**
   * Scale wall length to fit viewport
   */
  get scaleFactor(): number {
    if (!this.wall) return 1;
    return (this.viewBoxWidth - 2 * this.padding) / this.wall.lengthMm;
  }

  /**
   * Scale wall height to fit viewport
   */
  get heightScaleFactor(): number {
    if (!this.wall) return 1;
    const maxHeight = this.wall.heightMm || 2000;
    return (this.viewBoxHeight - 2 * this.padding) / maxHeight;
  }

  /**
   * Get scaled X position
   */
  scaleX(positionMm: number): number {
    return this.padding + positionMm * this.scaleFactor;
  }

  /**
   * Get scaled Y position
   */
  scaleY(heightMm: number): number {
    return (
      this.viewBoxHeight - this.padding - heightMm * this.heightScaleFactor
    );
  }

  /**
   * Get scaled width
   */
  scaleWidth(widthMm: number): number {
    return widthMm * this.scaleFactor;
  }

  /**
   * Get scaled height
   */
  scaleHeight(heightMm: number): number {
    return heightMm * this.heightScaleFactor;
  }

  /**
   * Check if position is a decorative stud
   */
  isDecorativeStud(position: number): boolean {
    return (
      this.studLayout?.decorativeStudPositionsMm.includes(position) || false
    );
  }
}
