import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ConfigurationEditorComponent } from "./components/configuration-editor/configuration-editor.component";
import { ConfigurationGridComponent } from "./components/configuration-grid/configuration-grid.component";
import { ImportWizardComponent } from "./components/import-wizard/import-wizard.component";
import { BulkEditorComponent } from "./components/bulk-editor/bulk-editor.component";
import { ValueViewerComponent } from "./components/value-viewer/value-viewer.component";
import { ConfigurationStore } from "./store/configuration.store";
import { ConfigurationService } from "./services/configuration.service";
import { NotificationService } from "./services/notification.service";
import { SeedDataService } from "./services/seed-data.service";
import { BasketService } from "./services/basket.service";
import { BasketStorageService } from "./services/basket-storage.service";
import { ConfigurationExportService } from "./services/configuration-export.service";
import { ConfigurationStorageService } from "./services/configuration-storage.service";
import { TeamMemberService } from "./services/team-member.service";
import { Configuration } from "./models/configuration.model";
import { ConfigurationType } from "./models/configuration-type.enum";
import { Basket } from "./models/basket.model";

@Component({
  selector: "app-configuration-manager",
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigurationGridComponent],
  templateUrl: "./configuration-manager.component.html",
  styleUrls: ["./configuration-manager.component.scss"],
})
export class ConfigurationManagerComponent implements OnInit {
  protected readonly store = inject(ConfigurationStore);
  private readonly configService = inject(ConfigurationService);
  private readonly configStorageService = inject(ConfigurationStorageService);
  private readonly notificationService = inject(NotificationService);
  private readonly seedDataService: SeedDataService = inject(SeedDataService);
  private readonly basketService = inject(BasketService);
  private readonly basketStorageService = inject(BasketStorageService);
  private readonly exportService = inject(ConfigurationExportService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly modalService = inject(NgbModal);

  devMode = false;
  showBasketModal = false;
  saving = false;
  exporting = false;
  selectedConfigurations: Configuration[] = [];
  newBasketName = "";
  dbBlockedWarning = false;

  async ngOnInit(): Promise<void> {
    console.log("[ngOnInit] Starting application initialization...");
    this.store.setLoading(true);
    this.store.setDbBlockedWarning(false);
    console.log("[ngOnInit] Loading state set to true");

    try {
      // Load baskets first to ensure Product basket exists
      console.log("[ngOnInit] Step 1: Loading baskets...");
      await this.loadBaskets();
      console.log(
        "[ngOnInit] ✓ Baskets loaded. Current baskets:",
        this.store.baskets(),
      );
      console.log(
        "[ngOnInit] Current basket ID:",
        this.store.currentBasketId(),
      );

      // Then load configurations (will seed into Product basket if needed)
      console.log("[ngOnInit] Step 2: Loading configurations...");
      await this.loadConfigurations();
      console.log(
        "[ngOnInit] ✓ Configurations loaded. Count:",
        this.store.configurations().length,
      );

      // If no configurations exist, offer to seed data
      if (this.store.configurations().length === 0) {
        console.log(
          "[ngOnInit] No configurations found, will prompt for sample data after 500ms",
        );
        setTimeout(() => {
          if (
            confirm(
              "No configurations found. Would you like to load sample data?",
            )
          ) {
            console.log("[ngOnInit] User chose to load sample data");
            this.onSeedSampleData();
          } else {
            console.log("[ngOnInit] User declined to load sample data");
          }
        }, 500);
      } else {
        console.log(
          "[ngOnInit] Configurations exist, skipping sample data prompt",
        );
      }
    } catch (error) {
      console.error("[ngOnInit] ✗ Failed to initialize application:", error);
      console.error("[ngOnInit] Error stack:", (error as Error)?.stack);

      // Check if the error is database blocked
      const errorMsg = (error as Error)?.message || "";
      if (errorMsg.includes("blocked") || errorMsg.includes("other tabs")) {
        console.log("[ngOnInit] Database blocked by other tabs detected");
        this.store.setDbBlockedWarning(true);
      }

      this.notificationService.error(
        "Failed to initialize application. Please refresh the page.",
      );
    } finally {
      console.log("[ngOnInit] Setting loading state to false");
      this.store.setLoading(false);
      console.log("[ngOnInit] Initialization complete. Final state:");
      console.log("  - Baskets:", this.store.baskets().length);
      console.log("  - Configurations:", this.store.configurations().length);
      console.log("  - Current basket ID:", this.store.currentBasketId());
    }
  }

  private async loadBaskets(): Promise<void> {
    console.log("[loadBaskets] Starting basket initialization...");
    try {
      // Always ensure the Product basket exists first
      console.log(
        "[loadBaskets] Calling basketService.initializeDefaultBasket()...",
      );
      const productBasket = await this.basketService.initializeDefaultBasket();
      console.log("[loadBaskets] ✓ Product basket initialized:", productBasket);

      // Get all baskets (should include the Product basket now)
      console.log("[loadBaskets] Fetching all baskets...");
      const baskets = await this.basketService.getAll();
      console.log("[loadBaskets] ✓ Retrieved baskets:", baskets);

      console.log("[loadBaskets] Updating store with baskets...");
      this.store.setBaskets(baskets);
      console.log(
        "[loadBaskets] Setting current basket ID to:",
        productBasket.id,
      );
      this.store.setCurrentBasketId(productBasket.id);
      console.log("[loadBaskets] ✓ Basket initialization complete");
    } catch (error) {
      console.error("[loadBaskets] ✗ Failed to load baskets:", error);
      console.error("[loadBaskets] Error details:", (error as Error)?.message);
      console.error("[loadBaskets] Error stack:", (error as Error)?.stack);
      this.notificationService.error(
        `Failed to initialize baskets: ${(error as Error).message}`,
      );
      // Don't let basket errors block the app - set a default empty state
      console.log("[loadBaskets] Setting empty baskets array as fallback");
      this.store.setBaskets([]);
      throw error; // Re-throw to be caught by ngOnInit
    }
  }

  private async loadConfigurations(): Promise<void> {
    console.log("[loadConfigurations] Starting configuration load...");
    try {
      const currentBasketId = this.store.currentBasketId();
      if (!currentBasketId) {
        console.log(
          "[loadConfigurations] No basket selected, loading all configurations",
        );
        const configurations = await this.configService.getAll();
        console.log(
          "[loadConfigurations] ✓ Retrieved configurations:",
          configurations.length,
          "items",
        );
        this.store.setConfigurations(configurations);
        return;
      }

      console.log(
        "[loadConfigurations] Loading configurations for basket:",
        currentBasketId,
      );
      const configurations =
        await this.configService.getByBasketId(currentBasketId);
      console.log(
        "[loadConfigurations] ✓ Retrieved configurations:",
        configurations.length,
        "items",
      );
      if (configurations.length > 0) {
        console.log("[loadConfigurations] First config:", configurations[0]);
      }
      console.log("[loadConfigurations] Updating store...");
      this.store.setConfigurations(configurations);
      console.log("[loadConfigurations] ✓ Configuration load complete");
    } catch (error) {
      console.error("[LoadConfig] Error:", (error as Error)?.message);
      this.notificationService.error(
        `Failed to load configurations: ${(error as Error).message}`,
      );
      this.store.setError((error as Error).message);
      this.store.setConfigurations([]);
    }
  }

  async onNewConfiguration(): Promise<void> {
    const modalRef = this.modalService.open(ConfigurationEditorComponent, {
      fullscreen: true,
      backdrop: "static",
      keyboard: false,
    });

    // Set the basket ID for new configuration
    modalRef.componentInstance.basketId = this.store.currentBasketId();

    modalRef.result.then(
      async (configuration: Configuration) => {
        if (configuration) {
          await this.onSaveConfiguration(configuration);
        }
      },
      () => {
        // Modal dismissed/cancelled
      },
    );
  }

  async onSaveConfiguration(configuration: Configuration): Promise<void> {
    // Check if this is an update (configuration already exists in store)
    const existingConfig = this.store
      .configurations()
      .find(
        (c) =>
          c.id === configuration.id && c.basketId === configuration.basketId,
      );

    if (existingConfig && configuration.updates.length > 0) {
      // This is an update - capture the previous value
      const latestUpdate =
        configuration.updates[configuration.updates.length - 1];

      // If the latest update doesn't have a previousValue, set it to the existing configuration's value
      if (!latestUpdate.previousValue) {
        latestUpdate.previousValue = existingConfig.value;
        console.log("[SaveConfig] Captured previous value for update:", {
          configName: configuration.name,
          updateDate: latestUpdate.date,
          previousValueLength: latestUpdate.previousValue.length,
          newValueLength: configuration.value.length,
        });
      }
    }

    this.store.addConfiguration(configuration);

    // Add the configuration to the current basket
    const currentBasketId = this.store.currentBasketId();
    if (currentBasketId) {
      try {
        await this.basketService.addConfiguration(
          currentBasketId,
          configuration.id,
        );
        const updatedBasket = await this.basketService.getById(currentBasketId);
        if (updatedBasket) {
          this.store.updateBasket(updatedBasket);
        }
      } catch (error) {
        console.error("Failed to add configuration to basket:", error);
      }
    }

    this.notificationService.success("Configuration saved successfully");
  }

  onRowDoubleClicked(configuration: Configuration): void {
    // IMPORTANT: The configuration parameter comes from AG Grid row data which may not have all fields
    // Retrieve the full configuration from the store to ensure all data (including configSourceMetadata) is present
    const fullConfiguration = this.store
      .configurations()
      .find((c) => c.id === configuration.id);

    const modalRef = this.modalService.open(ConfigurationEditorComponent, {
      fullscreen: true,
      backdrop: "static",
      keyboard: false,
    });

    // Set the configuration to edit and basket ID
    modalRef.componentInstance.configuration =
      fullConfiguration || configuration;
    modalRef.componentInstance.basketId = this.store.currentBasketId();

    modalRef.result.then(
      async (updatedConfiguration: Configuration) => {
        if (updatedConfiguration) {
          await this.onSaveConfiguration(updatedConfiguration);
        }
      },
      () => {
        // Modal dismissed/cancelled
      },
    );
  }

  onSelectionChanged(configurations: Configuration[]): void {
    this.selectedConfigurations = configurations;
    this.store.setSelectedIds(configurations.map((c) => c.id));
  }

  onTypeFilterChanged(type: ConfigurationType | null): void {
    this.store.setFilterType(type);
  }

  onSearchTermChanged(term: string): void {
    this.store.setSearchTerm(term);
  }

  onViewValue(event: {
    value: string;
    type: ConfigurationType;
    name: string;
    previousValue?: string;
    nextValue?: string;
  }): void {
    console.log("[ConfigManager.onViewValue] Received event:", {
      name: event.name,
      valueLength: event.value?.length || 0,
      previousValueLength: event.previousValue?.length || 0,
      nextValueLength: event.nextValue?.length || 0,
      hasPreviousValue: !!event.previousValue,
      hasNextValue: !!event.nextValue,
      previousValuePreview: event.previousValue
        ? event.previousValue.substring(0, 100) + "..."
        : "(empty)",
      nextValuePreview: event.nextValue
        ? event.nextValue.substring(0, 100) + "..."
        : "(empty)",
    });

    // Open full-screen modal to display only the value
    const modalRef = this.modalService.open(ValueViewerComponent, {
      fullscreen: true,
      backdrop: "static",
    });

    modalRef.componentInstance.value = event.value;
    modalRef.componentInstance.configurationType = event.type;
    modalRef.componentInstance.configName = event.name;
    modalRef.componentInstance.previousValue = event.previousValue || "";
    modalRef.componentInstance.nextValue = event.nextValue || "";

    console.log("[ConfigManager.onViewValue] Set modal inputs:", {
      previousValue: modalRef.componentInstance.previousValue?.length || 0,
      nextValue: modalRef.componentInstance.nextValue?.length || 0,
    });
  }

  async onResetDatabase(): Promise<void> {
    if (
      !confirm(
        "This will delete all configurations and reload sample data. Are you sure?",
      )
    ) {
      return;
    }

    try {
      this.store.setLoading(true);

      // CRITICAL: Close all database connections BEFORE attempting to delete
      console.log("[onResetDatabase] Closing all database connections...");
      (this.configService as any).storageService.closeConnection();

      // Wait a moment for connections to fully close
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reset the entire database (deletes and recreates with new schema)
      console.log("[onResetDatabase] Deleting and recreating database...");
      await this.basketStorageService.resetDatabase();

      // Clear all existing configuration data
      await this.configService.clearAll();

      // Reinitialize baskets
      const productBasket = await this.basketService.initializeDefaultBasket();
      this.store.setBaskets([productBasket]);
      this.store.setCurrentBasketId(productBasket.id);

      // Generate and save new seed data with update entries
      const seedData = this.seedDataService.generateSeedData(productBasket.id);
      console.log("[onResetDatabase] First seed config BEFORE save:", {
        name: seedData[0]?.name,
        hasMetadata: !!seedData[0]?.configSourceMetadata,
        metadataPreview: seedData[0]?.configSourceMetadata?.substring(0, 100),
      });
      for (const config of seedData) {
        await this.configService.saveWithUpdates(config);
      }

      // Reload configurations
      const configurations = await this.configService.getAll();
      console.log("[onResetDatabase] Loaded configurations from storage:", {
        total: configurations.length,
        firstConfig: configurations[0],
        firstHasMetadata: !!configurations[0]?.configSourceMetadata,
        processConfigs: configurations.filter(
          (c) => c.type === "Processes (JavaScript)",
        ).length,
        processWithMetadata: configurations.filter(
          (c) => c.type === "Processes (JavaScript)" && c.configSourceMetadata,
        ).length,
      });
      this.store.setConfigurations(configurations);

      // Add all to Product basket
      await this.basketService.update(productBasket.id, {
        configurationIds: configurations.map((c) => c.id),
      });
      const updatedBasket = await this.basketService.getById(productBasket.id);
      if (updatedBasket) {
        this.store.updateBasket(updatedBasket);
      }

      this.notificationService.success(
        `Database reset: Loaded ${configurations.length} configurations with update history`,
      );
    } catch (error) {
      this.notificationService.error(
        `Failed to reset database: ${(error as Error).message}`,
      );
    } finally {
      this.store.setLoading(false);
    }
  }

  async onForceDeleteDatabase(): Promise<void> {
    console.log("[Force Delete DB] Starting force delete process...");

    if (
      !confirm(
        "This will force delete the entire database and refresh the page. Continue?",
      )
    ) {
      console.log("[Force Delete DB] User cancelled operation");
      return;
    }

    console.log("[Force Delete DB] User confirmed, proceeding with deletion");

    try {
      // Close any existing connections
      console.log(
        "[Force Delete DB] Checking for existing database connections...",
      );
      if ((this.basketStorageService as any).db) {
        console.log("[Force Delete DB] Found existing connection, closing...");
        (this.basketStorageService as any).db.close();
        (this.basketStorageService as any).db = null;
        console.log("[Force Delete DB] Connection closed successfully");
      } else {
        console.log("[Force Delete DB] No existing connection found");
      }

      // Give browser time to close connections
      console.log(
        "[Force Delete DB] Waiting 100ms for connections to close...",
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log(
        "[Force Delete DB] Wait complete, initiating database deletion...",
      );

      // Force delete the database
      const deleteRequest = indexedDB.deleteDatabase("ConfigurationManagerDB");
      console.log(
        "[Force Delete DB] Delete request created for ConfigurationManagerDB",
      );

      deleteRequest.onsuccess = async () => {
        console.log("[Force Delete DB] ✓ Database deletion successful!");
        // Wait a bit to ensure deletion is fully processed
        console.log("[Force Delete DB] Waiting 200ms before reload...");
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("[Force Delete DB] Reloading page...");
        // Refresh the page to reinitialize everything
        window.location.reload();
      };

      deleteRequest.onerror = (event) => {
        console.error("[Force Delete DB] ✗ Delete request failed:", event);
        console.error(
          "[Force Delete DB] Error details:",
          (event.target as any)?.error,
        );
        console.log("[Force Delete DB] Attempting page reload anyway...");
        // Refresh anyway
        window.location.reload();
      };

      deleteRequest.onblocked = () => {
        console.warn(
          "[Force Delete DB] ⚠ Database deletion blocked by other connections",
        );
        // More user-friendly approach when blocked
        if (
          confirm(
            "Database deletion is blocked by other browser tabs. Would you like to:\n\n- Click OK to refresh this page anyway (recommended)\n- Click Cancel to manually close other tabs first",
          )
        ) {
          console.log(
            "[Force Delete DB] User chose to force refresh despite block",
          );
          // Force refresh even if blocked
          window.location.reload();
        } else {
          console.log(
            "[Force Delete DB] User chose to manually close tabs first",
          );
          alert(
            'Please close all other tabs/windows using this application, then try "Force Delete DB" again.',
          );
        }
      };
    } catch (error) {
      console.error(
        "[Force Delete DB] ✗ Exception caught during force delete:",
        error,
      );
      console.error("[Force Delete DB] Stack trace:", (error as Error)?.stack);
      console.log("[Force Delete DB] Attempting page reload after error...");
      window.location.reload();
    }
  }

  openBasketModal(): void {
    this.newBasketName = "";
    this.showBasketModal = true;
  }

  closeBasketModal(): void {
    this.showBasketModal = false;
    this.newBasketName = "";
  }

  async createBasket(): Promise<void> {
    if (!this.newBasketName.trim()) {
      this.notificationService.error("Please enter a basket name");
      return;
    }

    try {
      // Check if basket with this name already exists
      const existingBasket = this.store
        .baskets()
        .find(
          (b) =>
            b.name.toLowerCase() === this.newBasketName.trim().toLowerCase(),
        );

      if (existingBasket) {
        this.notificationService.error(
          `Basket "${this.newBasketName}" already exists`,
        );
        return;
      }

      const basket = await this.basketService.create(this.newBasketName.trim());

      this.store.addBasket(basket);
      this.notificationService.success(
        `Basket "${basket.name}" created successfully`,
      );
      this.closeBasketModal();
    } catch (error) {
      console.error("Failed to create basket:", error);

      // Check if this is the baskets store missing error
      if (
        error instanceof Error &&
        error.message.includes("Baskets store not found")
      ) {
        this.notificationService.error(
          'Database needs to be reinitialized. Please click "Force Delete DB" button to reset and try again.',
        );
      } else {
        this.notificationService.error(
          `Failed to create basket: ${(error as Error).message}`,
        );
      }
    }
  }

  async onSeedSampleData(): Promise<void> {
    if (
      !confirm(
        "This will create sample configurations in the Product (core) basket. Continue?",
      )
    ) {
      return;
    }

    try {
      this.store.setLoading(true);

      // Ensure baskets are loaded
      await this.loadBaskets();

      // Get the Product basket
      const productBasket = this.store
        .baskets()
        .find((b) => b.name === "Product (core)");

      if (!productBasket) {
        throw new Error(
          "Product (core) basket not found. Database initialization failed.",
        );
      }

      const seedData = this.seedDataService.generateSeedData(productBasket.id);

      // Save all seed data with their update entries and add to Product basket
      const savedConfigIds: number[] = [];
      for (const config of seedData) {
        const savedConfig = await this.configService.saveWithUpdates(config);
        savedConfigIds.push(savedConfig.id);
      }

      // Add all seeded configurations to the Product basket
      await this.basketService.addMultipleConfigurations(
        productBasket.id,
        savedConfigIds,
      );

      // Update the basket in the store
      const updatedBasket = await this.basketService.getById(productBasket.id);
      if (updatedBasket) {
        this.store.updateBasket(updatedBasket);
      }

      // Reload configurations to refresh the grid
      const configurations = await this.configService.getAll();
      this.store.setConfigurations(configurations);

      this.notificationService.success(
        `Successfully created ${savedConfigIds.length} sample configurations in Product (core) basket`,
      );
    } catch (error) {
      console.error("Failed to seed sample data:", error);
      this.notificationService.error(
        `Failed to create sample data: ${(error as Error).message}`,
      );
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * Converts hex color to rgba with specified alpha transparency
   * @param hex - Hex color code (e.g., '#20c997')
   * @param alpha - Alpha value between 0 and 1 (e.g., 0.3 for 30% opacity)
   * @returns rgba string (e.g., 'rgba(32, 201, 151, 0.3)')
   */
  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  async selectBasket(basketId: number): Promise<void> {
    this.store.setCurrentBasketId(basketId);
    this.store.setSelectedIds([]);

    // Reload configurations to refresh update entries for the new basket
    this.store.setLoading(true);
    try {
      const configurations = await this.configService.getAll();
      this.store.setConfigurations(configurations);
    } catch (error) {
      console.error("Failed to reload configurations:", error);
    } finally {
      this.store.setLoading(false);
    }
  }

  async addSelectedToBasket(basketId: number): Promise<void> {
    if (this.selectedConfigurations.length === 0) {
      this.notificationService.error("No configurations selected");
      return;
    }

    try {
      // Create independent copies of configurations for the target basket
      const newConfigIds: number[] = [];

      for (const config of this.selectedConfigurations) {
        // Get next ID for the new configuration copy
        const newId = await this.configStorageService.getNextId();
        const currentUser = this.teamMemberService.getCurrentUser();
        const now = new Date();

        // Create a complete copy of the configuration with all update entries
        const configCopy: Configuration = {
          id: newId,
          basketId,
          name: config.name,
          type: config.type,
          version: config.version,
          value: config.value,
          updates: [...config.updates], // Copy all update entries
          createdDate: now,
          createdBy: currentUser,
          lastModifiedDate: now,
          lastModifiedBy: currentUser,
        };

        // Save the configuration with its update history
        const newConfig = await this.configService.saveWithUpdates(configCopy);

        newConfigIds.push(newConfig.id);
        this.store.addConfiguration(newConfig);
      }

      // Add the new configuration IDs to the target basket
      const updatedBasket = await this.basketService.addMultipleConfigurations(
        basketId,
        newConfigIds,
      );
      this.store.updateBasket(updatedBasket);

      const basket = this.store.baskets().find((b) => b.id === basketId);
      this.notificationService.success(
        `Copied ${newConfigIds.length} configuration(s) to "${basket?.name}"`,
      );

      // Reload configurations to show the new copies
      await this.loadConfigurations();
    } catch (error) {
      this.notificationService.error(
        `Failed to add to basket: ${(error as Error).message}`,
      );
    }
  }

  async removeSelectedFromBasket(): Promise<void> {
    const currentBasketId = this.store.currentBasketId();
    if (!currentBasketId) {
      this.notificationService.error("No basket selected");
      return;
    }

    if (this.selectedConfigurations.length === 0) {
      this.notificationService.error("No configurations selected");
      return;
    }

    try {
      const basket = this.store.baskets().find((b) => b.id === currentBasketId);
      if (!basket) return;

      console.log(
        `[RemoveFromBasket] Removing ${this.selectedConfigurations.length} configs from basket ${currentBasketId}`,
      );

      for (const config of this.selectedConfigurations) {
        console.log(
          `[RemoveFromBasket] Processing config ${config.id} from basket ${currentBasketId}`,
        );

        // Delete the actual configuration from database
        try {
          await this.configService.delete(currentBasketId, config.id);
          console.log(
            `[RemoveFromBasket] ✓ Deleted config ${config.id} from database`,
          );
        } catch (deleteError) {
          console.error(
            `[RemoveFromBasket] ✗ Failed to delete config ${config.id}:`,
            deleteError,
          );
        }

        // Remove from basket metadata
        try {
          await this.basketService.removeConfiguration(
            currentBasketId,
            config.id,
          );
          console.log(
            `[RemoveFromBasket] ✓ Removed config ${config.id} from basket metadata`,
          );
        } catch (removeError) {
          console.error(
            `[RemoveFromBasket] ✗ Failed to remove from basket:`,
            removeError,
          );
        }
      }

      console.log(`[RemoveFromBasket] Finished processing all configs`);

      const updatedBasket = await this.basketService.getById(currentBasketId);
      if (updatedBasket) {
        console.log("[RemoveFromBasket] Updated basket:", {
          id: updatedBasket.id,
          name: updatedBasket.name,
          configCount: updatedBasket.configurationIds.length,
          configIds: updatedBasket.configurationIds,
        });
        this.store.updateBasket(updatedBasket);

        // Reload configurations to reflect the removal
        await this.loadConfigurations();

        console.log(
          "[RemoveFromBasket] After reload - store has:",
          this.store.configurations().length,
          "configs",
        );

        this.notificationService.success(
          `Removed ${this.selectedConfigurations.length} configuration(s) from "${basket.name}"`,
        );
      }
    } catch (error) {
      this.notificationService.error(
        `Failed to remove from basket: ${(error as Error).message}`,
      );
    }
  }

  async onExportSelected(): Promise<void> {
    const selected = this.store.selectedConfigurations();

    if (selected.length === 0) {
      this.notificationService.error("No configurations selected for export");
      return;
    }

    try {
      this.exporting = true;
      const currentBasket = this.store.currentBasket();
      await this.exportService.exportConfigurations(
        selected,
        currentBasket?.name,
        currentBasket?.id,
      );
      this.notificationService.success(
        `Exported ${selected.length} configuration(s) successfully`,
      );
    } catch (error) {
      this.notificationService.error(
        `Failed to export: ${(error as Error).message}`,
      );
    } finally {
      this.exporting = false;
    }
  }

  async onExportBasket(): Promise<void> {
    const currentBasket = this.store.currentBasket();

    if (!currentBasket) {
      this.notificationService.error("No basket selected");
      return;
    }

    const basketConfigs = this.store.basketConfigurations();

    if (basketConfigs.length === 0) {
      this.notificationService.error("Current basket is empty");
      return;
    }

    try {
      this.exporting = true;
      await this.exportService.exportBasket(currentBasket, basketConfigs);
      this.notificationService.success(
        `Exported basket "${currentBasket.name}" with ${basketConfigs.length} configuration(s)`,
      );
    } catch (error) {
      this.notificationService.error(
        `Failed to export basket: ${(error as Error).message}`,
      );
    } finally {
      this.exporting = false;
    }
  }

  async onBulkEdit(): Promise<void> {
    const selectedConfigs = this.store.selectedConfigurations();
    if (selectedConfigs.length === 0) return;

    const modalRef = this.modalService.open(BulkEditorComponent, {
      fullscreen: true,
    });

    modalRef.componentInstance.configurations = selectedConfigs;

    try {
      const result = await modalRef.result;
      if (!result) return;

      const { version, updateEntries } = result;

      // Apply changes to all selected configurations
      this.saving = true;
      const currentUser = this.teamMemberService.getCurrentUser();
      const updateDate = new Date();

      for (const config of selectedConfigs) {
        // Apply each update entry separately to maintain proper history
        for (const entry of updateEntries) {
          await this.configService.update(
            config.basketId,
            config.id,
            { version },
            {
              ...entry,
              previousValue: config.value,
            },
          );
        }
      }

      // Reload configurations
      const configurations = await this.configService.getAll();
      this.store.setConfigurations(configurations);

      this.notificationService.success(
        `Successfully updated ${selectedConfigs.length} configuration(s)`,
      );
    } catch (error: any) {
      if (error !== undefined && error !== "backdrop click") {
        console.error("Bulk edit failed:", error);
        this.notificationService.error(
          `Bulk edit failed: ${(error as Error).message}`,
        );
      }
    } finally {
      this.saving = false;
    }
  }

  /**
   * Open import wizard modal
   */
  onImport(): void {
    const modalRef = this.modalService.open(ImportWizardComponent, {
      fullscreen: true,
      backdrop: "static",
      keyboard: false,
    });

    modalRef.result.then(
      async (result) => {
        if (result === "completed") {
          // Reload both baskets and configurations after successful import
          await this.loadBaskets();
          await this.loadConfigurations();
          this.notificationService.success("Import completed successfully");
        }
      },
      () => {
        // Modal dismissed/cancelled
      },
    );
  }
}
