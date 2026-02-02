import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ImportWizardStore } from "../../store/import-wizard.store";
import {
  ConfigurationImportService,
  ConflictDetection,
} from "../../services/configuration-import.service";
import { ConfigurationStore } from "../../store/configuration.store";
import { ConfigurationService } from "../../services/configuration.service";
import { BasketService } from "../../services/basket.service";
import { NotificationService } from "../../services/notification.service";
import { Configuration } from "../../models/configuration.model";
import { ConflictComparisonComponent } from "../conflict-comparison/conflict-comparison.component";

@Component({
  selector: "app-import-wizard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./import-wizard.component.html",
  styleUrl: "./import-wizard.component.scss",
})
export class ImportWizardComponent implements OnInit {
  modal = inject(NgbActiveModal);
  modalService = inject(NgbModal);
  wizardStore = inject(ImportWizardStore);
  configStore = inject(ConfigurationStore);
  importService = inject(ConfigurationImportService);
  configService = inject(ConfigurationService);
  basketService = inject(BasketService);
  notificationService = inject(NotificationService);

  isDragOver = false;

  /**
   * Get basket name by ID
   */
  getBasketName(basketId: number | null): string {
    if (!basketId) return "";
    return (
      this.configStore.baskets().find((b) => b.id === basketId)?.name || ""
    );
  }

  ngOnInit() {
    // Reset wizard state on init
    this.wizardStore.reset();

    // Auto-select the currently active basket
    const currentBasketId = this.configStore.currentBasketId();
    if (currentBasketId) {
      this.wizardStore.setTargetBasket(currentBasketId);
    }

    // Trigger file browser on init
    setTimeout(() => {
      const fileInput = document.getElementById(
        "file-input",
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }, 100);
  }

  /**
   * Close modal
   */
  onClose() {
    this.modal.close();
  }

  /**
   * Handle basket selection
   */
  onBasketSelect(basketId: number) {
    this.wizardStore.setTargetBasket(basketId);
  }

  /**
   * Handle file upload
   */
  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await this.processFile(input.files[0]);
    }
  }

  /**
   * Handle drag and drop
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      await this.processFile(event.dataTransfer.files[0]);
    }
  }

  /**
   * Process uploaded ZIP file
   */
  private async processFile(file: File) {
    this.wizardStore.setProcessing(true);
    this.wizardStore.setError(null);

    try {
      // Validate ZIP file
      const validation = await this.importService.validateZipFile(file);
      if (!validation.valid) {
        this.wizardStore.setError(validation.error || "Invalid ZIP file");
        this.wizardStore.setProcessing(false);
        return;
      }

      // Parse ZIP file
      const { configurations, manifest } =
        await this.importService.parseZipFile(file);

      if (configurations.length === 0) {
        this.wizardStore.setError("No configurations found in ZIP file");
        this.wizardStore.setProcessing(false);
        return;
      }

      // Store parsed data
      this.wizardStore.setUploadedData(file, configurations, manifest);

      // Detect conflicts
      const conflicts = this.importService.detectConflicts(
        configurations,
        this.configStore.configurations(),
        this.wizardStore.targetBasketId() || undefined,
      );

      this.wizardStore.setConflicts(conflicts);

      this.wizardStore.setProcessing(false);

      // Auto-advance if no conflicts
      if (conflicts.filter((c) => c.hasConflict).length === 0) {
        this.notificationService.success(
          `${configurations.length} configuration(s) ready to import (no conflicts)`,
        );
      } else {
        this.notificationService.info(
          `${conflicts.filter((c) => c.hasConflict).length} conflict(s) detected - please review`,
        );
      }
    } catch (error) {
      console.error("Error processing file:", error);
      this.wizardStore.setError(
        error instanceof Error ? error.message : "Unknown error",
      );
      this.wizardStore.setProcessing(false);
    }
  }

  /**
   * Set resolution for a conflict
   */
  onSetResolution(
    configId: number,
    strategy: "overwrite" | "keep" | "import-as-new",
  ) {
    this.wizardStore.setResolution(configId, strategy);
  }

  /**
   * View conflict details in modal
   */
  onViewConflict(conflict: ConflictDetection) {
    const modalRef = this.modalService.open(ConflictComparisonComponent, {
      size: "xl",
      backdrop: "static",
      scrollable: true,
    });

    // Pass the conflict to the component
    modalRef.componentInstance.conflict = conflict;

    // Handle resolution from the modal
    modalRef.componentInstance.resolveConflict.subscribe(
      (strategy: "overwrite" | "keep" | "import-as-new") => {
        this.onSetResolution(conflict.configId, strategy);
        modalRef.close();
      },
    );
  }

  /**
   * Apply same resolution to all conflicts
   */
  onResolveAll(strategy: "overwrite" | "keep" | "import-as-new") {
    this.wizardStore.setResolutionForAll(strategy);
  }

  /**
   * Execute import with resolutions
   */
  async onExecuteImport() {
    this.wizardStore.setProcessing(true);
    this.wizardStore.setError(null);

    try {
      const importedConfigs = this.wizardStore.importedConfigurations();
      const conflicts = this.wizardStore.conflicts();
      const resolutions = this.wizardStore.resolutions();
      const targetBasketId = this.wizardStore.targetBasketId();

      let completed = 0;
      let failed = 0;

      for (const imported of importedConfigs) {
        try {
          const conflict = conflicts.find(
            (c) => c.configId === imported.configuration.id,
          );

          if (!conflict) continue;

          if (!conflict.hasConflict) {
            // No conflict, import with full update history
            const configToImport: Configuration = {
              ...imported.configuration,
              basketId: targetBasketId!,
              createdDate: new Date(imported.configuration.createdDate),
              lastModifiedDate: new Date(
                imported.configuration.lastModifiedDate,
              ),
              updates: imported.configuration.updates.map((u) => ({
                ...u,
                date: new Date(u.date),
              })),
            };
            await this.configService.saveWithUpdates(configToImport);

            // Update basket membership if targetBasketId is set
            if (targetBasketId) {
              await this.basketService.addConfiguration(
                targetBasketId,
                imported.configuration.id,
              );
            }

            completed++;
          } else {
            // Apply resolution strategy
            const resolution = resolutions.find(
              (r) => r.configId === imported.configuration.id,
            );

            if (!resolution) {
              failed++;
              continue;
            }

            switch (resolution.strategy) {
              case "overwrite":
                // Overwrite existing with imported (including update history)
                const configToOverwrite: Configuration = {
                  ...imported.configuration,
                  basketId: targetBasketId!,
                  createdDate: new Date(imported.configuration.createdDate),
                  lastModifiedDate: new Date(
                    imported.configuration.lastModifiedDate,
                  ),
                  updates: imported.configuration.updates.map((u) => ({
                    ...u,
                    date: new Date(u.date),
                  })),
                };
                await this.configService.saveWithUpdates(configToOverwrite);

                // Update basket membership if targetBasketId is set
                if (targetBasketId) {
                  await this.basketService.addConfiguration(
                    targetBasketId,
                    imported.configuration.id,
                  );
                }

                completed++;
                break;

              case "keep":
                // Keep existing, skip import
                completed++;
                break;

              case "import-as-new":
                // Generate new ID and import
                const newConfig = await this.configService.create(
                  targetBasketId!,
                  `${imported.configuration.name} (imported)`,
                  imported.configuration.type,
                  imported.configuration.version,
                  imported.configuration.value,
                );

                // Update basket membership if targetBasketId is set
                if (targetBasketId) {
                  await this.basketService.addConfiguration(
                    targetBasketId,
                    newConfig.id,
                  );
                }

                completed++;
                break;
            }
          }
        } catch (error) {
          console.error(
            `Error importing config ${imported.configuration.id}:`,
            error,
          );
          failed++;
        }
      }

      this.wizardStore.updateCompletionStats(completed, failed);

      if (failed === 0) {
        this.notificationService.success(
          `Successfully imported ${completed} configuration(s)`,
        );
        // Close modal on successful import
        this.modal.close("completed");
      } else {
        this.notificationService.warning(
          `Imported ${completed} configuration(s), ${failed} failed`,
        );
      }
    } catch (error) {
      console.error("Error executing import:", error);
      this.wizardStore.setError(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      this.wizardStore.setProcessing(false);
    }
  }
}
