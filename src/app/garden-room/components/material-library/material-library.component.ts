import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GardenRoomStore } from "../../store/garden-room.store";
import { MaterialLibrary } from "../../models/material-library.model";

/**
 * MaterialLibraryComponent - Configure available stock lengths and sheet materials
 * Allows users to define material library for cut optimization
 */
@Component({
  selector: "app-material-library",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./material-library.component.html",
  styleUrls: ["./material-library.component.scss"],
})
export class MaterialLibraryComponent {
  readonly store = inject(GardenRoomStore);

  // Expose timber sections from store
  get timberSections() {
    return this.store.materialLibrary().timberSections;
  }

  // Expose sheet materials from store
  get sheetMaterials() {
    return this.store.materialLibrary().sheetMaterials;
  }

  // Expose PIR boards from store
  get pirBoards() {
    return this.store.materialLibrary().pirBoards;
  }
}
