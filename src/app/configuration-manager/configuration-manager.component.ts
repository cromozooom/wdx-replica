import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationEditorComponent } from './components/configuration-editor/configuration-editor.component';
import { ConfigurationStore } from './store/configuration.store';
import { ConfigurationService } from './services/configuration.service';
import { NotificationService } from './services/notification.service';
import { SeedDataService } from './services/seed-data.service';
import { Configuration } from './models/configuration.model';

@Component({
  selector: 'app-configuration-manager',
  standalone: true,
  imports: [CommonModule, ConfigurationEditorComponent],
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.scss'],
})
export class ConfigurationManagerComponent implements OnInit {
  protected readonly store = inject(ConfigurationStore);
  private readonly configService = inject(ConfigurationService);
  private readonly notificationService = inject(NotificationService);
  private readonly seedDataService = inject(SeedDataService);

  showEditor = false;
  editingConfiguration: Configuration | null = null;

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
        
        // Save all seed data
        for (const config of seedData) {
          await this.configService.create(
            config.name,
            config.type,
            config.version,
            config.value
          );
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
}
