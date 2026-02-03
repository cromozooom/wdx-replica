import { Injectable } from "@angular/core";
import {
  ConfigurationType,
  getConfigurationFormat,
} from "../models/configuration-type.enum";
import { UpdateEntry } from "../models/update-entry.model";
import { isValidVersion } from "../utils/version-validator";
import { isValidJiraTicket } from "../utils/jira-validator";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: "root",
})
export class ConfigurationValidatorService {
  validateConfigurationValue(
    value: string,
    type: ConfigurationType,
  ): ValidationResult {
    const format = getConfigurationFormat(type);

    switch (format) {
      case "json":
        return this.validateJSON(value);
      case "xml":
        return this.validateFetchXML(value);
      default:
        return { valid: true, errors: [] };
    }
  }

  validateJSON(value: string): ValidationResult {
    try {
      JSON.parse(value);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${(error as Error).message}`],
      };
    }
  }

  validateFetchXML(value: string): ValidationResult {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, "application/xml");

      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        return {
          valid: false,
          errors: [`Invalid XML: ${parserError.textContent}`],
        };
      }

      // Check for required fetch element
      if (!doc.querySelector("fetch")) {
        return {
          valid: false,
          errors: ["FetchXML must contain a <fetch> root element"],
        };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [`XML parsing error: ${(error as Error).message}`],
      };
    }
  }

  validateVersion(version: string): ValidationResult {
    if (!isValidVersion(version)) {
      return {
        valid: false,
        errors: ["Version must match format V#.#.# (e.g., V1.0.0)"],
      };
    }
    return { valid: true, errors: [] };
  }

  validateUpdateEntry(entry: UpdateEntry): ValidationResult {
    const errors: string[] = [];

    // Must have either Jira ticket OR comment
    if (!entry.jiraTicket && !entry.comment) {
      errors.push("Update entry must have either a Jira ticket or a comment");
    }

    // Validate Jira ticket format if provided
    if (entry.jiraTicket && !isValidJiraTicket(entry.jiraTicket)) {
      errors.push("Jira ticket must match format WPO-##### (e.g., WPO-12345)");
    }

    // Validate date
    if (!(entry.date instanceof Date) || isNaN(entry.date.getTime())) {
      errors.push("Update entry must have a valid date");
    }

    // Validate madeBy
    if (!entry.madeBy || entry.madeBy.trim().length === 0) {
      errors.push('Update entry must have a "Made By" value');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
