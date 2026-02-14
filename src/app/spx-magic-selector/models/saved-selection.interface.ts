/**
 * Saved Selection - Represents a selection stored in IndexedDB
 */
export interface SavedSelection {
  /** Unique identifier */
  id: string;

  /** User-provided name for this selection */
  name: string;

  /** Domain ID (crm-scheduling, document-management, etc.) */
  domainId: string;

  /** Domain display name */
  domainName: string;

  /** Selected item name */
  itemName: string;

  /** Selected item type (Form or Document) */
  itemType: "Form" | "Document";

  /** Selected entity name */
  entityName: string;

  /** Selected query name */
  queryName: string;

  /** Query description */
  queryDescription: string;

  /** Estimated record count */
  estimatedRecords: number;

  /** Date when selection was created */
  createdAt: Date;

  /** Date when selection was last modified */
  updatedAt: Date;

  /** Full selection event data for reference */
  selectionData: {
    itemId: string;
    queryId: string;
    source: "dropdown" | "modal" | "api";
  };
}
