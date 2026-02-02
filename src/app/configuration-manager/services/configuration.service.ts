import { Injectable } from "@angular/core";
import { Configuration } from "../models/configuration.model";
import { ConfigurationType } from "../models/configuration-type.enum";
import { UpdateEntry } from "../models/update-entry.model";
import { ConfigurationStorageService } from "./configuration-storage.service";
import { ConfigurationValidatorService } from "./configuration-validator.service";
import { TeamMemberService } from "./team-member.service";

@Injectable({
  providedIn: "root",
})
export class ConfigurationService {
  constructor(
    private storage: ConfigurationStorageService,
    private validator: ConfigurationValidatorService,
    private teamMemberService: TeamMemberService,
  ) {}

  async getAll(): Promise<Configuration[]> {
    return this.storage.getAll();
  }

  async getById(id: number): Promise<Configuration | undefined> {
    return this.storage.getById(id);
  }

  async create(
    name: string,
    type: ConfigurationType,
    version: string,
    value: string,
  ): Promise<Configuration> {
    // Validate version format
    const versionValidation = this.validator.validateVersion(version);
    if (!versionValidation.valid) {
      throw new Error(versionValidation.errors.join(", "));
    }

    // Validate configuration value
    const valueValidation = this.validator.validateConfigurationValue(
      value,
      type,
    );
    if (!valueValidation.valid) {
      throw new Error(valueValidation.errors.join(", "));
    }

    const id = await this.storage.getNextId();
    const currentUser = this.teamMemberService.getCurrentUser();
    const now = new Date();

    const configuration: Configuration = {
      id,
      name,
      type,
      version,
      value,
      updates: [],
      createdDate: now,
      createdBy: currentUser,
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
    };

    await this.storage.save(configuration);
    return configuration;
  }

  async update(
    id: number,
    updates: Partial<Configuration>,
    updateEntry?: UpdateEntry,
  ): Promise<Configuration> {
    const existing = await this.storage.getById(id);
    if (!existing) {
      throw new Error(`Configuration with ID ${id} not found`);
    }

    // Validate version if changed
    if (updates.version) {
      const versionValidation = this.validator.validateVersion(updates.version);
      if (!versionValidation.valid) {
        throw new Error(versionValidation.errors.join(", "));
      }
    }

    // Validate value if changed
    if (updates.value && updates.type) {
      const valueValidation = this.validator.validateConfigurationValue(
        updates.value,
        updates.type,
      );
      if (!valueValidation.valid) {
        throw new Error(valueValidation.errors.join(", "));
      }
    }

    // Validate update entry if provided
    if (updateEntry) {
      const entryValidation = this.validator.validateUpdateEntry(updateEntry);
      if (!entryValidation.valid) {
        throw new Error(entryValidation.errors.join(", "));
      }
    }

    const currentUser = this.teamMemberService.getCurrentUser();
    const now = new Date();

    const updated: Configuration = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
      updates: updateEntry
        ? [...existing.updates, updateEntry]
        : existing.updates,
    };

    await this.storage.save(updated);
    return updated;
  }

  async delete(id: number): Promise<void> {
    return this.storage.delete(id);
  }
}
