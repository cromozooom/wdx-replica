import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  GardenRoomStore,
  updateMaterialLibrary,
} from "../../store/garden-room.store";
import { MaterialLibrary } from "../../models/material-library.model";

/**
 * MaterialLibraryComponent - Configure available stock lengths and sheet materials
 * Allows users to define material library for cut optimization
 */
@Component({
  selector: "app-material-library",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./material-library.component.html",
  styleUrls: ["./material-library.component.scss"],
})
export class MaterialLibraryComponent {
  materialForm: FormGroup;
  readonly store = inject(GardenRoomStore);

  constructor(private fb: FormBuilder) {
    // Load current material library from store
    const currentLibrary = this.store.materialLibrary();

    this.materialForm = this.fb.group({
      stockLengths: this.fb.array(
        currentLibrary.stockLengthsMm.map((length) =>
          this.fb.control(length, [Validators.required, Validators.min(500)]),
        ),
      ),
      sheetMaterials: this.fb.array(
        currentLibrary.sheetMaterials.length > 0
          ? currentLibrary.sheetMaterials.map((sheet) =>
              this.fb.group({
                id: [sheet.id],
                name: [sheet.name, Validators.required],
                widthMm: [
                  sheet.widthMm,
                  [Validators.required, Validators.min(100)],
                ],
                heightMm: [
                  sheet.heightMm,
                  [Validators.required, Validators.min(100)],
                ],
              }),
            )
          : [],
      ),
    });

    // Sync form changes to store
    this.materialForm.valueChanges.subscribe(() => {
      if (this.materialForm.valid) {
        updateMaterialLibrary(this.store, this.getMaterialLibrary());
      }
    });
  }

  /**
   * Create sheet material form group
   */
  createSheetMaterial(name: string, width: number, height: number): FormGroup {
    return this.fb.group({
      id: [crypto.randomUUID()],
      name: [name, Validators.required],
      widthMm: [width, [Validators.required, Validators.min(100)]],
      heightMm: [height, [Validators.required, Validators.min(100)]],
    });
  }

  /**
   * Get stock lengths form array
   */
  get stockLengths(): FormArray {
    return this.materialForm.get("stockLengths") as FormArray;
  }

  /**
   * Get sheet materials form array
   */
  get sheetMaterials(): FormArray {
    return this.materialForm.get("sheetMaterials") as FormArray;
  }

  /**
   * Add new stock length
   */
  addStockLength() {
    this.stockLengths.push(
      this.fb.control(2400, [Validators.required, Validators.min(500)]),
    );
  }

  /**
   * Remove stock length at index
   */
  removeStockLength(index: number) {
    if (this.stockLengths.length > 1) {
      this.stockLengths.removeAt(index);
    }
  }

  /**
   * Add new sheet material
   */
  addSheetMaterial() {
    this.sheetMaterials.push(this.createSheetMaterial("New Sheet", 2400, 1200));
  }

  /**
   * Remove sheet material at index
   */
  removeSheetMaterial(index: number) {
    this.sheetMaterials.removeAt(index);
  }

  /**
   * Get material library from form
   */
  getMaterialLibrary(): MaterialLibrary {
    return {
      stockLengthsMm: this.stockLengths.value.sort(
        (a: number, b: number) => a - b,
      ),
      sheetMaterials: this.sheetMaterials.value,
    };
  }
}
