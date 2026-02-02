import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationEditorComponent } from './components/configuration-editor/configuration-editor.component';
import { ConfigurationGridComponent } from './components/configuration-grid/configuration-grid.component';
import { ConfigurationStore } from './store/configuration.store';
import { ConfigurationService } from './services/configuration.service';
import { NotificationService } from './services/notification.service';
import { SeedDataService } from './services/seed-data.service';
import { Configuration } from './models/configuration.model';
import { ConfigurationType } from './models/configuration-type.enum';

@Component({
  selector: 'app-configuration-manager',
  standalone: true,
  imports: [CommonModule, ConfigurationEditorComponent, ConfigurationGridComponent],
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.scss'],
})
export class ConfigurationManagerComponent implements OnInit {
  protected readonly store = inject(ConfigurationStore);
  private readonly configService = inject(ConfigurationService);
  private readonly notificationService = inject(NotificationService);
  private readonly seedDataService: SeedDataService = inject(SeedDataService);

  showEditor = false;
  editingConfiguration: Configuration | null = null;
  selectedConfigurations: Configuration[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadConfigurations();
  }

  private async loadConfigurations(): Promise<void> {
    try {
      this.store.setLoading(true);
      let configurations = await this.configService.getAll();
      
      // Seed sample data if database is empty
      if (configurations.length === 0) {
        console.log('Database is empty, seeding sample data...');
        const seedData = this.seedDataService.generateSeedData();
        
        // Save all seed data with their update entries
        for (const config of seedData) {
          await this.configService.saveWithUpdates(config);
        }
        
        // Reload configurations
        configurations = await this.configService.getAll();
        this.notificationService.success(
          `Loaded ${configurations.length} sample wealth management configurations`
        );
      }
      
      this.store.setConfigurations(configurations);
    } catch (error) {
      this.notificationService.error(
        `Failed to load configurations: ${(error as Error).message}`
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
    this.showEditor = false;
    this.notificationService.success('Configuration saved successfully');
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
    this.store.setSelectedIds(configurations.map(c => c.id));
  }

  onTypeFilterChanged(type: ConfigurationType | null): void {
    this.store.setFilterType(type);
  }

  onSearchTermChanged(term: string): void {
    this.store.setSearchTerm(term);
  }

  async onResetDatabase(): Promise<void> {
    if (!confirm('This will delete all configurations and reload sample data. Are you sure?')) {
      return;
    }

    try {
      this.store.setLoading(true);
      
      // Clear all existing data
      await this.configService.clearAll();
      
      // Generate and save new seed data with update entries
      const seedData = this.seedDataService.generateSeedData();
      for (const config of seedData) {
        await this.configService.saveWithUpdates(config);
      }
      
      // Reload configurations
      const configurations = await this.configService.getAll();
      this.store.setConfigurations(configurations);
      
      this.notificationService.success(
        `Database reset: Loaded ${configurations.length} configurations with update history`
      );
    } catch (error) {
      this.notificationService.error(
        `Failed to reset database: ${(error as Error).message}`
      );
    } finally {
      this.store.setLoading(false);
    }
  }
}
