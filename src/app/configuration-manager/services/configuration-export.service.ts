import { Injectable, inject } from "@angular/core";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Configuration } from "../models/configuration.model";
import { ConfigurationType } from "../models/configuration-type.enum";
import { Basket } from "../models/basket.model";

/**
 * Service for exporting configurations as ZIP archives with basket metadata
 */
@Injectable({
  providedIn: "root",
})
export class ConfigurationExportService {
  /**
   * Export selected configurations as ZIP with basket metadata
   */
  async exportConfigurations(
    configurations: Configuration[],
    basketName?: string,
    basketId?: number,
  ): Promise<void> {
    if (configurations.length === 0) {
      throw new Error("No configurations to export");
    }

    const zip = new JSZip();

    // Create manifest with export metadata
    const manifest = {
      exportDate: new Date().toISOString(),
      exportedBy: "Configuration Manager",
      version: "1.0",
      totalConfigurations: configurations.length,
      basket: basketName
        ? {
            name: basketName,
            id: basketId,
            configurationIds: configurations.map((c) => c.id),
          }
        : null,
      configurations: configurations.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        version: c.version,
      })),
    };

    console.log(
      "[EXPORT] Creating manifest with basketName:",
      basketName,
      "manifest:",
      manifest,
    );

    // Add manifest to ZIP root
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // Create configurations folder
    const configsFolder = zip.folder("configurations");
    if (!configsFolder) {
      throw new Error("Failed to create configurations folder");
    }

    // Add each configuration
    for (const config of configurations) {
      // Create folder for this configuration
      const configFolder = configsFolder.folder(
        this.sanitizeFilename(config.name),
      );
      if (!configFolder) continue;

      // Add metadata file
      const metadata = {
        id: config.id,
        name: config.name,
        type: config.type,
        version: config.version,
        createdDate: config.createdDate,
        createdBy: config.createdBy,
        lastModifiedDate: config.lastModifiedDate,
        lastModifiedBy: config.lastModifiedBy,
        updates: config.updates || [],
      };
      configFolder.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Add value file with appropriate extension
      const extension = this.getFileExtension(config.type);
      const valueContent = this.formatValueContent(config.value, config.type);
      configFolder.file(`value.${extension}`, valueContent);
    }

    // Generate ZIP and download
    const blob = await zip.generateAsync({ type: "blob" });
    const filename = this.generateFilename(basketName, configurations.length);
    saveAs(blob, filename);
  }

  /**
   * Export entire basket as ZIP
   */
  async exportBasket(
    basket: Basket,
    configurations: Configuration[],
  ): Promise<void> {
    await this.exportConfigurations(configurations, basket.name, basket.id);
  }

  /**
   * Get file extension based on configuration type
   */
  private getFileExtension(type: ConfigurationType): string {
    switch (type) {
      case ConfigurationType.DashboardConfig:
      case ConfigurationType.FormConfig:
      case ConfigurationType.SystemSetting:
        return "json";
      case ConfigurationType.FetchXMLQuery:
      case ConfigurationType.DashboardQuery:
        return "xml";
      case ConfigurationType.Process:
        return "json";
      default:
        return "txt";
    }
  }

  /**
   * Format value content for export
   */
  private formatValueContent(value: string, type: ConfigurationType): string {
    // For JSON types, try to format nicely
    if (
      type === ConfigurationType.DashboardConfig ||
      type === ConfigurationType.FormConfig ||
      type === ConfigurationType.SystemSetting ||
      type === ConfigurationType.Process
    ) {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, return as-is
        return value;
      }
    }

    // For XML and other types, return as-is
    return value;
  }

  /**
   * Sanitize filename to remove invalid characters
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_\-\.]/gi, "_");
  }

  /**
   * Generate export filename
   */
  private generateFilename(
    basketName: string | undefined,
    count: number,
  ): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const prefix = basketName ? `${this.sanitizeFilename(basketName)}_` : "";
    return `${prefix}configs_${count}_${timestamp}.zip`;
  }
}
