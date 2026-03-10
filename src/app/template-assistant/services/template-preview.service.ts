/**
 * Template preview service.
 * Interpolates templates with customer data and renders preview.
 */

import { Injectable } from "@angular/core";
import { format } from "date-fns";
import {
  CustomerRecord,
  DataField,
  type CurrencyFormatConfig,
  type DateFormatConfig,
  type NumberFormatConfig,
  type TextFormatConfig,
} from "../models";

@Injectable({ providedIn: "root" })
export class TemplatePreviewService {
  /**
   * Interpolate template markdown with customer data.
   * Replaces {{field_id}} placeholders with formatted values.
   * Handles escaped underscores from markdown serialization.
   */
  interpolate(
    markdown: string,
    customerData: CustomerRecord,
    fields: DataField[],
  ): string {
    console.log("Preview interpolation:", {
      markdown,
      hasData: !!customerData,
      dataKeys: customerData ? Object.keys(customerData) : [],
      fieldsCount: fields.length,
    });

    // First unescape any escaped underscores in field placeholders
    // Markdown serializers often escape _ to \_ to prevent italic formatting
    const unescaped = markdown.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
      // Remove backslash escapes from field ID
      const cleanFieldId = fieldId.replace(/\\/g, "");
      console.log(`Unescaping: ${fieldId} → ${cleanFieldId}`);
      return `{{${cleanFieldId}}}`;
    });

    // Now interpolate with clean field IDs
    return unescaped.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
      const field = fields.find((f) => f.id === fieldId);
      const value = customerData[fieldId];

      console.log(`Interpolating ${fieldId}:`, {
        found: !!field,
        value,
        fieldLabel: field?.label,
      });

      if (value === null || value === undefined) {
        return "(Not Available)";
      }

      return this.formatValue(value, field);
    });
  }

  /**
   * Format value based on field type and configuration.
   */
  private formatValue(value: any, field?: DataField): string {
    if (!field) {
      return String(value);
    }

    switch (field.type) {
      case "date":
        return this.formatDate(value, field.formatConfig as DateFormatConfig);

      case "currency":
        return this.formatCurrency(
          value,
          field.formatConfig as CurrencyFormatConfig,
        );

      case "number":
        return this.formatNumber(
          value,
          field.formatConfig as NumberFormatConfig,
        );

      case "text":
        return this.formatText(value, field.formatConfig as TextFormatConfig);

      default:
        return String(value);
    }
  }

  /**
   * Format date value using date-fns.
   */
  private formatDate(value: any, config?: DateFormatConfig): string {
    if (!config) {
      config = { dateFormat: "dd MMM yyyy" }; // Default format
    }

    try {
      const date = typeof value === "string" ? new Date(value) : value;
      return format(date, config.dateFormat);
    } catch (error) {
      return String(value);
    }
  }

  /**
   * Format currency value.
   */
  private formatCurrency(value: any, config?: CurrencyFormatConfig): string {
    if (!config) {
      config = { currencyCode: "GBP", decimals: 2, symbolPosition: "before" };
    }

    const numValue = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(numValue)) {
      return String(value);
    }

    const decimals = config.decimals ?? 2;
    const formatted = numValue.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const symbols: Record<string, string> = {
      GBP: "£",
      EUR: "€",
      USD: "$",
    };

    const symbol = symbols[config.currencyCode] || config.currencyCode;

    return config.symbolPosition === "after"
      ? `${formatted} ${symbol}`
      : `${symbol}${formatted}`;
  }

  /**
   * Format number value.
   */
  private formatNumber(value: any, config?: NumberFormatConfig): string {
    if (!config) {
      config = { decimals: 0, thousandSeparator: "," };
    }

    const numValue = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(numValue)) {
      return String(value);
    }

    return numValue.toLocaleString("en-GB", {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }

  /**
   * Format text value with optional pattern and transform.
   */
  private formatText(value: any, config?: TextFormatConfig): string {
    let text = String(value);

    if (config?.transform) {
      switch (config.transform) {
        case "uppercase":
          text = text.toUpperCase();
          break;
        case "lowercase":
          text = text.toLowerCase();
          break;
        case "capitalize":
          text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          break;
      }
    }

    // Apply pattern if provided (e.g., "##-##-##" for sort code)
    if (config?.pattern) {
      // Simple pattern implementation - replace # with characters
      let patternIndex = 0;
      let valueIndex = 0;
      let result = "";

      while (patternIndex < config.pattern.length && valueIndex < text.length) {
        if (config.pattern[patternIndex] === "#") {
          result += text[valueIndex];
          valueIndex++;
        } else {
          result += config.pattern[patternIndex];
        }
        patternIndex++;
      }

      return result;
    }

    return text;
  }

  /**
   * Extract all field references from template markdown.
   */
  extractFieldReferences(markdown: string): string[] {
    const matches = markdown.matchAll(/\{\{(\w+)\}\}/g);
    return Array.from(matches, (m) => m[1]);
  }
}
