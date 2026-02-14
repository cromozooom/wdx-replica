/**
 * Domain type configuration for SPX Magic Selector
 * Maps domain IDs to their display labels and types
 */

export interface DomainTypeConfig {
  id: string;
  label: string;
  type: "Form" | "Document";
}

/**
 * Available domain types
 */
export const DOMAIN_TYPES: Record<string, DomainTypeConfig> = {
  "crm-scheduling": {
    id: "crm-scheduling",
    label: "Form",
    type: "Form",
  },
  "document-management": {
    id: "document-management",
    label: "Document Management",
    type: "Document",
  },
};

/**
 * Get domain type label by ID
 */
export function getDomainTypeLabel(domainId: string): string {
  return DOMAIN_TYPES[domainId]?.type || "Source";
}

/**
 * Get full domain label by ID
 */
export function getDomainLabel(domainId: string): string {
  return DOMAIN_TYPES[domainId]?.label || domainId;
}
