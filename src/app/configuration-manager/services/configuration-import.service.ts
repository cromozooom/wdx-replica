import { Injectable } from "@angular/core";
import JSZip from "jszip";
import { Configuration } from "../models/configuration.model";
import { ConfigurationType } from "../models/configuration-type.enum";

export interface BasketManifest {
  basketName: string;
  basketId: string;
  exportDate: string;
  exportVersion: string;
  configurations: string[]; // Array of configuration IDs
}

export interface ImportedConfiguration {
  configuration: Configuration;
  source: "zip";
}

export interface ConflictDetection {
  configId: number;
  hasConflict: boolean;
  existingConfig?: Configuration;
  importedConfig: Configuration;
  differences: ConfigurationDiff;
}

export interface ConfigurationDiff {
  metadata: MetadataDiff;
  content: ContentDiff;
  basket: BasketDiff;
}

export interface MetadataDiff {
  name?: { existing: string; imported: string };
  version?: { existing: string; imported: string };
  type?: { existing: ConfigurationType; imported: ConfigurationType };
}

export interface ContentDiff {
  hasChanges: boolean;
  existing?: string;
  imported: string;
}

export interface BasketDiff {
  hasChanges: boolean;
  existing?: string;
  imported?: string;
}

@Injectable({
  providedIn: "root",
})
export class ConfigurationImportService {
  /**
   * Parse ZIP file and extract configurations
   */
  async parseZipFile(file: File): Promise<{
    configurations: ImportedConfiguration[];
    manifest: BasketManifest | null;
  }> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      // Parse manifest if exists
      let manifest: BasketManifest | null = null;
      const manifestFile = zipContent.file("manifest.json");
      if (manifestFile) {
        const manifestContent = await manifestFile.async("string");
        const rawManifest = JSON.parse(manifestContent);
        console.log("[IMPORT] Raw manifest from ZIP:", rawManifest);

        // Map the manifest structure to BasketManifest interface
        if (rawManifest.basket) {
          manifest = {
            basketName: rawManifest.basket.name || "",
            basketId: rawManifest.basket.id?.toString() || "",
            exportDate: rawManifest.exportDate || "",
            exportVersion: rawManifest.version || "",
            configurations: rawManifest.basket.configurationIds || [],
          };
        }

        console.log("[IMPORT] Mapped manifest:", manifest);
      }

      // Extract configurations from 'configurations/' directory
      const configurations: ImportedConfiguration[] = [];
      const configFolder = zipContent.folder("configurations");

      if (configFolder) {
        const configFolders = Object.keys(zipContent.files).filter(
          (name) =>
            name.startsWith("configurations/") &&
            name.split("/").length === 3 &&
            name.endsWith("/"),
        );

        for (const folderPath of configFolders) {
          const configId = folderPath.split("/")[1];

          // Read metadata.json
          const metadataFile = zipContent.file(
            `configurations/${configId}/metadata.json`,
          );
          if (!metadataFile) continue;

          const metadataContent = await metadataFile.async("string");
          const metadata = JSON.parse(metadataContent);

          // Read value file (could be .json or .xml)
          let valueContent = "";
          const valueJsonFile = zipContent.file(
            `configurations/${configId}/value.json`,
          );
          const valueXmlFile = zipContent.file(
            `configurations/${configId}/value.xml`,
          );

          if (valueJsonFile) {
            valueContent = await valueJsonFile.async("string");
          } else if (valueXmlFile) {
            valueContent = await valueXmlFile.async("string");
          }

          // Reconstruct Configuration object
          const configuration: Configuration = {
            ...metadata,
            value: valueContent,
          };

          configurations.push({
            configuration,
            source: "zip",
          });
        }
      }

      return { configurations, manifest };
    } catch (error) {
      console.error("Error parsing ZIP file:", error);
      throw new Error("Invalid ZIP file structure");
    }
  }

  /**
   * Detect conflicts between imported and existing configurations
   */
  detectConflicts(
    importedConfigs: ImportedConfiguration[],
    existingConfigs: Configuration[],
    currentBasketId?: number,
  ): ConflictDetection[] {
    return importedConfigs.map((imported) => {
      const existing = existingConfigs.find(
        (c) => c.id === imported.configuration.id,
      );

      if (!existing) {
        return {
          configId: imported.configuration.id,
          hasConflict: false,
          importedConfig: imported.configuration,
          differences: this.createEmptyDiff(),
        };
      }

      const differences = this.findDifferences(
        existing,
        imported.configuration,
        currentBasketId,
      );
      const hasConflict = this.hasMeaningfulDifferences(differences);

      return {
        configId: imported.configuration.id,
        hasConflict,
        existingConfig: existing,
        importedConfig: imported.configuration,
        differences,
      };
    });
  }

  /**
   * Find differences between existing and imported configurations
   */
  private findDifferences(
    existing: Configuration,
    imported: Configuration,
    currentBasketId?: number,
  ): ConfigurationDiff {
    const metadataDiff: MetadataDiff = {};
    const contentDiff: ContentDiff = {
      hasChanges: false,
      imported: imported.value,
    };
    const basketDiff: BasketDiff = {
      hasChanges: false,
    };

    // Compare metadata
    if (existing.name !== imported.name) {
      metadataDiff.name = { existing: existing.name, imported: imported.name };
    }
    if (existing.version !== imported.version) {
      metadataDiff.version = {
        existing: existing.version,
        imported: imported.version,
      };
    }
    if (existing.type !== imported.type) {
      metadataDiff.type = { existing: existing.type, imported: imported.type };
    }

    // Compare content
    if (existing.value !== imported.value) {
      contentDiff.hasChanges = true;
      contentDiff.existing = existing.value;
      contentDiff.imported = imported.value;
    }

    // Note: Basket assignment is managed via Basket.configurationIds[] array
    // and is handled by the import wizard component, not stored on Configuration objects

    return {
      metadata: metadataDiff,
      content: contentDiff,
      basket: basketDiff,
    };
  }

  /**
   * Check if differences are meaningful enough to require user attention
   */
  private hasMeaningfulDifferences(diff: ConfigurationDiff): boolean {
    const hasMetadataChanges = Object.keys(diff.metadata).length > 0;
    const hasContentChanges = diff.content.hasChanges;
    const hasBasketChanges = diff.basket.hasChanges;

    return hasMetadataChanges || hasContentChanges || hasBasketChanges;
  }

  /**
   * Create empty diff structure
   */
  private createEmptyDiff(): ConfigurationDiff {
    return {
      metadata: {},
      content: { hasChanges: false, imported: "" },
      basket: { hasChanges: false },
    };
  }

  /**
   * Validate ZIP file structure and size
   */
  async validateZipFile(file: File): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Check file size (max 50MB)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: "ZIP file size exceeds 50MB limit",
      };
    }

    // Check file type
    if (
      !file.name.endsWith(".zip") &&
      file.type !== "application/zip" &&
      file.type !== "application/x-zip-compressed"
    ) {
      return {
        valid: false,
        error: "File must be a ZIP archive",
      };
    }

    try {
      const zip = new JSZip();
      await zip.loadAsync(file);

      // Check for configurations folder
      const hasConfigFolder = Object.keys(zip.files).some((name) =>
        name.startsWith("configurations/"),
      );

      if (!hasConfigFolder) {
        return {
          valid: false,
          error: "ZIP file missing configurations/ directory",
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid or corrupted ZIP file",
      };
    }
  }

  /**
   * Generate new ID for "Import as New" scenario
   */
  generateNewId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}
