import { Component, inject, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  GardenRoomStore,
  updateBuildEnvelope,
} from "../../store/garden-room.store";

/**
 * GlobalSettingsComponent - Configure build envelope constraints
 * Allows users to set legal height limits, offsets, and fall ratio
 */
@Component({
  selector: "app-global-settings",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./global-settings.component.html",
  styleUrls: ["./global-settings.component.scss"],
})
export class GlobalSettingsComponent {
  buildEnvelopeForm: FormGroup;
  readonly store = inject(GardenRoomStore);

  constructor(private fb: FormBuilder) {
    this.buildEnvelopeForm = this.fb.group({
      maxLegalHeightMm: [2500, [Validators.required, Validators.min(1)]],
      concreteOffsetMm: [50, [Validators.required, Validators.min(0)]],
      roofSystemMm: [173.5, [Validators.required, Validators.min(0)]],
      floorSystemMm: [100, [Validators.required, Validators.min(0)]],
      fallRatioRise: [1, [Validators.required, Validators.min(1)]],
      fallRatioRun: [40, [Validators.required, Validators.min(1)]],
      roofFrontExtensionMm: [100, [Validators.required, Validators.min(0)]],
      roofBackExtensionMm: [100, [Validators.required, Validators.min(0)]],
    });

    // Sync form changes to store
    this.buildEnvelopeForm.valueChanges.subscribe((values) => {
      if (this.buildEnvelopeForm.valid) {
        updateBuildEnvelope(this.store, this.getBuildEnvelope());
      }
    });

    // Initialize store with form values
    updateBuildEnvelope(this.store, this.getBuildEnvelope());
  }

  /**
   * Get the current build envelope values from form
   */
  getBuildEnvelope() {
    return {
      maxLegalHeightMm: this.buildEnvelopeForm.value.maxLegalHeightMm,
      concreteOffsetMm: this.buildEnvelopeForm.value.concreteOffsetMm,
      roofSystemMm: this.buildEnvelopeForm.value.roofSystemMm,
      floorSystemMm: this.buildEnvelopeForm.value.floorSystemMm,
      fallRatio: {
        rise: this.buildEnvelopeForm.value.fallRatioRise,
        run: this.buildEnvelopeForm.value.fallRatioRun,
      },
      roofFrontExtensionMm: this.buildEnvelopeForm.value.roofFrontExtensionMm,
      roofBackExtensionMm: this.buildEnvelopeForm.value.roofBackExtensionMm,
    };
  }

  /**
   * Check if form has validation errors
   */
  hasErrors(): boolean {
    return this.buildEnvelopeForm.invalid;
  }

  /**
   * Get computed wall heights from store
   */
  get maxWallFrameHeightMm() {
    return this.store.maxWallFrameHeightMm();
  }

  get frontWallHeightMm() {
    return this.store.frontWallHeightMm();
  }

  get backWallHeightMm() {
    return this.store.backWallHeightMm();
  }

  get isHeightValid() {
    return this.store.isHeightValid();
  }

  get roofDimensions() {
    return this.store.roofDimensions();
  }
}
