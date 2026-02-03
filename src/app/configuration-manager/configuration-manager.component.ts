import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ConfigurationEditorComponent } from "./components/configuration-editor/configuration-editor.component";
import { ConfigurationGridComponent } from "./components/configuration-grid/configuration-grid.component";
import { ImportWizardComponent } from "./components/import-wizard/import-wizard.component";
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
  imports: [
    CommonModule,
    FormsModule,
    ConfigurationEditorComponent,
    ConfigurationGridComponent,
  ],
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

  showEditor = false;
  showBasketModal = false;
  saving = false;
  exporting = false;
  editingConfiguration: Configuration | null = null;
  selectedConfigurations: Configuration[] = [];
  newBasketName = "";

  async ngOnInit(): Promise<void> {
    console.log("Initializing Configuration Manager...");

    // Load baskets first to ensure Product basket exists
    await this.loadBaskets();

    // Then load configurations (will seed into Product basket if needed)
    await this.loadConfigurations();

    console.log("Configuration Manager initialized successfully");
  }

  private async loadBaskets(): Promise<void> {
    try {
      // Always ensure the Product basket exists first
      console.log("Ensuring Product (core) basket exists...");
      const productBasket = await this.basketService.initializeDefaultBasket();
      console.log("Product basket initialized:", productBasket);

      // Get all baskets (should include the Product basket now)
      const baskets = await this.basketService.getAll();
      console.log("All baskets:", baskets);

      this.store.setBaskets(baskets);
      this.store.setCurrentBasketId(productBasket.id);

      console.log("Baskets loaded successfully");
    } catch (error) {
      console.error("Failed to load baskets:", error);
      this.notificationService.error(
        `Failed to initialize baskets: ${(error as Error).message}`,
      );
    }
  }

  private async loadConfigurations(): Promise<void> {
    try {
      console.log("⏳ [ConfigManager] loadConfigurations() started");
      this.store.setLoading(true);
      const configurations = await this.configService.getAll();

      console.log(`📚 Loaded ${configurations.length} existing configurations`);
      console.log(
        "🔍 [ConfigManager] Config IDs:",
        configurations.map((c) => `${c.id}:${c.name}`),
      );
      this.store.setConfigurations(configurations);
      console.log("✅ [ConfigManager] Configurations set in store");
    } catch (error) {
      console.error("Failed to load configurations:", error);
      this.notificationService.error(
        `Failed to load configurations: ${(error as Error).message}`,
      );
      this.store.setError((error as Error).message);
    } finally {
      this.store.setLoading(false);
    }
  }

  async onNewConfiguration(): Promise<void> {
    this.editingConfiguration = null;
    this.showEditor = true;
  }

  async onSaveConfiguration(configuration: Configuration): Promise<void> {
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

    this.showEditor = false;
    this.notificationService.success("Configuration saved successfully");
  }

  onCancelEditor(): void {
    this.showEditor = false;
    this.editingConfiguration = null;
  }

  onRowDoubleClicked(configuration: Configuration): void {
    this.editingConfiguration = configuration;
    this.showEditor = true;
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

      // Reset the entire database (deletes and recreates with new schema)
      await this.basketStorageService.resetDatabase();

      // Clear all existing configuration data
      await this.configService.clearAll();

      // Reinitialize baskets
      const productBasket = await this.basketService.initializeDefaultBasket();
      this.store.setBaskets([productBasket]);
      this.store.setCurrentBasketId(productBasket.id);

      // Generate and save new seed data with update entries
      const seedData = this.seedDataService.generateSeedData(productBasket.id);
      for (const config of seedData) {
        await this.configService.saveWithUpdates(config);
      }

      // Reload configurations
      const configurations = await this.configService.getAll();
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
    if (
      !confirm(
        "This will force delete the entire database and refresh the page. Continue?",
      )
    ) {
      return;
    }

    try {
      // Close any existing connections
      if ((this.basketStorageService as any).db) {
        (this.basketStorageService as any).db.close();
        (this.basketStorageService as any).db = null;
      }

      // Give browser time to close connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force delete the database
      const deleteRequest = indexedDB.deleteDatabase("ConfigurationManagerDB");
      deleteRequest.onsuccess = async () => {
        console.log("Database force deleted successfully");
        // Wait a bit to ensure deletion is fully processed
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Refresh the page to reinitialize everything
        window.location.reload();
      };
      deleteRequest.onerror = () => {
        console.error("Failed to delete database");
        // Refresh anyway
        window.location.reload();
      };
      deleteRequest.onblocked = () => {
        // More user-friendly approach when blocked
        if (
          confirm(
            "Database deletion is blocked by other browser tabs. Would you like to:\n\n- Click OK to refresh this page anyway (recommended)\n- Click Cancel to manually close other tabs first",
          )
        ) {
          // Force refresh even if blocked
          window.location.reload();
        } else {
          alert(
            'Please close all other tabs/windows using this application, then try "Force Delete DB" again.',
          );
        }
      };
    } catch (error) {
      console.error("Force delete error:", error);
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
    console.log("createBasket called with name:", this.newBasketName);

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

      console.log("Creating basket with name:", this.newBasketName.trim());
      const basket = await this.basketService.create(this.newBasketName.trim());
      console.log("Basket created:", basket);

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

      console.log("Manual seeding: Starting sample data creation...");

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

      console.log(
        `Seeding ${seedData.length} configurations into Product basket...`,
      );

      // Save all seed data with their update entries and add to Product basket
      const savedConfigIds: number[] = [];
      for (const config of seedData) {
        const savedConfig = await this.configService.saveWithUpdates(config);
        savedConfigIds.push(savedConfig.id);
        console.log(
          `Saved configuration: ${savedConfig.name} (ID: ${savedConfig.id})`,
        );
      }

      // Add all seeded configurations to the Product basket
      console.log(
        `Adding ${savedConfigIds.length} configurations to Product basket...`,
      );
      await this.basketService.addMultipleConfigurations(
        productBasket.id,
        savedConfigIds,
      );

      // Update the basket in the store
      const updatedBasket = await this.basketService.getById(productBasket.id);
      if (updatedBasket) {
        this.store.updateBasket(updatedBasket);
        console.log(
          `Product basket now contains ${updatedBasket.configurationIds.length} configurations`,
        );
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

  async selectBasket(basketId: number): Promise<void> {
    console.log("🏀 [ConfigManager] Selecting basket ID:", basketId);
    const basket = this.store.baskets().find((b) => b.id === basketId);
    console.log("📦 [ConfigManager] Basket details:", basket);
    this.store.setCurrentBasketId(basketId);

    // Reload configurations to refresh update entries for the new basket
    this.store.setLoading(true);
    console.log(
      "📥 [ConfigManager] Reloading configurations for basket switch...",
    );
    try {
      const configurations = await this.configService.getAll();
      console.log(
        "📚 [ConfigManager] Loaded configurations from DB:",
        configurations.length,
      );
      console.log(
        "🔍 [ConfigManager] Config IDs:",
        configurations.map((c) => c.id),
      );
      if (basket) {
        console.log(
          "🎯 [ConfigManager] Basket contains config IDs:",
          basket.configurationIds,
        );
      }
      this.store.setConfigurations(configurations);
      console.log("✅ [ConfigManager] Basket switch complete");
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

    console.log(
      "📋 [ConfigManager] Adding to basket:",
      basketId,
      "Configs:",
      this.selectedConfigurations.map((c) => c.id),
    );

    try {
      // Create independent copies of configurations for the target basket
      const newConfigIds: number[] = [];

      for (const config of this.selectedConfigurations) {
        // Get next ID for the new configuration copy
        const newId = await this.configStorageService.getNextId();
        console.log(
          "🆕 [ConfigManager] Creating copy: Original ID",
          config.id,
          "→ New ID",
          newId,
        );
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

      for (const config of this.selectedConfigurations) {
        await this.basketService.removeConfiguration(
          currentBasketId,
          config.id,
        );
      }

      const updatedBasket = await this.basketService.getById(currentBasketId);
      if (updatedBasket) {
        this.store.updateBasket(updatedBasket);
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
