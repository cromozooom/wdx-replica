import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationStore } from './store/configuration.store';
import { ConfigurationService } from './services/configuration.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-configuration-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.scss'],
})
export class ConfigurationManagerComponent implements OnInit {
  protected readonly store = inject(ConfigurationStore);
  private readonly configService = inject(ConfigurationService);
  private readonly notificationService = inject(NotificationService);

  async ngOnInit(): Promise<void> {
    await this.loadConfigurations();
  }

  private async loadConfigurations(): Promise<void> {
    try {
      this.store.setLoading(true);
      const configurations = await this.configService.getAll();
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
    // TODO: Open editor modal
    this.notificationService.info('New configuration - editor coming soon');
  }
}
