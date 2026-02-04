import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import { computed } from "@angular/core";
import {
  ConflictDetection,
  ImportedConfiguration,
  BasketManifest,
} from "../services/configuration-import.service";

export type ImportWizardStep =
  | "basket-selection"
  | "file-upload"
  | "conflict-review"
  | "completion";

export type ResolutionStrategy = "overwrite" | "keep" | "import-as-new";

export interface ConflictResolution {
  configId: number;
  strategy: ResolutionStrategy;
}

interface ImportWizardState {
  currentStep: ImportWizardStep;
  targetBasketId: number | null;
  uploadedFile: File | null;
  importedConfigurations: ImportedConfiguration[];
  manifest: BasketManifest | null;
  conflicts: ConflictDetection[];
  resolutions: ConflictResolution[];
  isProcessing: boolean;
  error: string | null;
  completedCount: number;
  failedCount: number;
}

const initialState: ImportWizardState = {
  currentStep: "basket-selection",
  targetBasketId: null,
  uploadedFile: null,
  importedConfigurations: [],
  manifest: null,
  conflicts: [],
  resolutions: [],
  isProcessing: false,
  error: null,
  completedCount: 0,
  failedCount: 0,
};

export const ImportWizardStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed((store) => ({
    /**
     * Check if current step is complete and can proceed
     */
    canProceed: computed(() => {
      switch (store.currentStep()) {
        case "basket-selection":
          return store.targetBasketId() !== null;
        case "file-upload":
          return (
            store.uploadedFile() !== null &&
            store.importedConfigurations().length > 0
          );
        case "conflict-review":
          // All conflicts must have resolutions
          const unresolvedConflicts = store
            .conflicts()
            .filter((c) => c.hasConflict)
            .filter(
              (c) =>
                !store.resolutions().some((r) => r.configId === c.configId),
            );
          return unresolvedConflicts.length === 0;
        case "completion":
          return false; // Final step, no proceeding
        default:
          return false;
      }
    }),

    /**
     * Get conflicts that still need resolution
     */
    unresolvedConflicts: computed(() => {
      return store
        .conflicts()
        .filter((c) => c.hasConflict)
        .filter(
          (c) => !store.resolutions().some((r) => r.configId === c.configId),
        );
    }),

    /**
     * Get total import summary
     */
    importSummary: computed(() => {
      const total = store.importedConfigurations().length;
      const totalConflicts = store
        .conflicts()
        .filter((c) => c.hasConflict).length;
      const resolvedConflicts = store
        .conflicts()
        .filter((c) => c.hasConflict)
        .filter((c) =>
          store.resolutions().some((r) => r.configId === c.configId),
        ).length;
      const unresolvedConflicts = totalConflicts - resolvedConflicts;
      const noConflicts = total - totalConflicts;
      const ready = noConflicts + resolvedConflicts;

      return {
        total,
        conflicts: unresolvedConflicts,
        resolved: resolvedConflicts,
        noConflicts,
        ready,
        completed: store.completedCount(),
        failed: store.failedCount(),
      };
    }),

    /**
     * Check if import is complete
     */
    isComplete: computed(() => {
      return store.currentStep() === "completion";
    }),
  })),
  withMethods((store) => ({
    /**
     * Set target basket for import
     */
    setTargetBasket(basketId: number) {
      patchState(store, { targetBasketId: basketId });
    },

    /**
     * Set uploaded file and parsed data
     */
    setUploadedData(
      file: File,
      configurations: ImportedConfiguration[],
      manifest: BasketManifest | null,
    ) {
      patchState(store, {
        uploadedFile: file,
        importedConfigurations: configurations,
        manifest,
      });
    },

    /**
     * Set detected conflicts
     */
    setConflicts(conflicts: ConflictDetection[]) {
      patchState(store, { conflicts });
    },

    /**
     * Set resolution for a specific conflict
     */
    setResolution(configId: number, strategy: ResolutionStrategy) {
      const resolutions = [...store.resolutions()];
      const existingIndex = resolutions.findIndex(
        (r) => r.configId === configId,
      );

      if (existingIndex >= 0) {
        resolutions[existingIndex] = { configId, strategy };
      } else {
        resolutions.push({ configId, strategy });
      }

      patchState(store, { resolutions });
    },

    /**
     * Apply resolution strategy to all conflicts
     */
    setResolutionForAll(strategy: ResolutionStrategy) {
      const resolutions = store
        .conflicts()
        .filter((c) => c.hasConflict)
        .map((c) => ({
          configId: c.configId,
          strategy,
        }));

      patchState(store, { resolutions });
    },

    /**
     * Navigate to specific step
     */
    goToStep(step: ImportWizardStep) {
      patchState(store, { currentStep: step });
    },

    /**
     * Go to next step
     */
    nextStep() {
      const steps: ImportWizardStep[] = [
        "basket-selection",
        "file-upload",
        "conflict-review",
        "completion",
      ];
      const currentIndex = steps.indexOf(store.currentStep());
      if (currentIndex < steps.length - 1) {
        patchState(store, { currentStep: steps[currentIndex + 1] });
      }
    },

    /**
     * Go to previous step
     */
    previousStep() {
      const steps: ImportWizardStep[] = [
        "basket-selection",
        "file-upload",
        "conflict-review",
        "completion",
      ];
      const currentIndex = steps.indexOf(store.currentStep());
      if (currentIndex > 0) {
        patchState(store, { currentStep: steps[currentIndex - 1] });
      }
    },

    /**
     * Set processing state
     */
    setProcessing(isProcessing: boolean) {
      patchState(store, { isProcessing });
    },

    /**
     * Set error state
     */
    setError(error: string | null) {
      patchState(store, { error });
    },

    /**
     * Update completion stats
     */
    updateCompletionStats(completed: number, failed: number) {
      patchState(store, { completedCount: completed, failedCount: failed });
    },

    /**
     * Reset wizard to initial state
     */
    reset() {
      patchState(store, initialState);
    },
  })),
);
