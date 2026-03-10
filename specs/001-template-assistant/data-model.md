# Data Model: Intelligent Template Assistant

**Feature**: Template editor with atomic pill nodes  
**Date**: 2026-03-10  
**Status**: Design Phase

## Overview

The Intelligent Template Assistant manages document templates with embedded
customer data fields. The data model consists of four core entities that enable
the "Dual-State" architecture: templates (blueprints), data fields (variable
definitions), customer records (actual data), and field formats (display
configuration).

---

## Core Entities

### 1. DocumentTemplate

Represents a reusable document structure containing static text and data field
placeholders.

```typescript
interface DocumentTemplate {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Human-readable template name */
  name: string;

  /** Markdown content with {{field_id}} placeholders for data fields */
  content: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last modification */
  updatedAt: string;

  /** Schema version for future migrations (currently 1) */
  version: number;

  /** Optional metadata */
  metadata?: {
    /** User-provided description */ description?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Last customer ID used for preview (optional) */
    lastPreviewCustomerId?: string;
  };
}
```

**Storage Format** (localStorage):

```json
{
  "wdx-templates": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Customer Account Summary",
      "content": "Dear {{title}} {{last_name}},\n\nYour account ending in {{account_number}} has a balance of {{balance}}.",
      "createdAt": "2026-03-10T14:30:00Z",
      "updatedAt": "2026-03-10T15:45:00Z",
      "version": 1,
      "metadata": {
        "description": "Standard account summary letter",
        "tags": ["accounts", "summary"]
      }
    }
  }
}
```

**Validation Rules**:

- `id`: Must be valid UUID v4
- `name`: 1-100 characters, unique per user
- `content`: Max 50,000 characters (localStorage constraint)
- `createdAt` / `updatedAt`: Must be valid ISO 8601 timestamps
- `version`: Must be positive integer (currently always 1)

**File Export Format** (`.wdx-template.json`):

```json
{
  "format": "wdx-template",
  "version": "1.0",
  "template": {
    "name": "Customer Account Summary",
    "content": "...",
    "metadata": {...}
  },
  "exportedAt": "2026-03-10T16:00:00Z"
}
```

---

### 2. DataField

Named reference to a piece of customer information that can be inserted into
templates.

```typescript
interface DataField {
  /** Unique field identifier (snake_case) */
  id: string;

  /** Display label shown in UI */
  label: string;

  /** Data type for formatting */
  type: "text" | "date" | "number" | "currency";

  /** Optional format configuration */
  formatConfig?: FieldFormatConfig;

  /** Field description (tooltip text) */
  description?: string;

  /** Whether field is required to have value */
  required?: boolean;

  /** Category for grouping in UI */
  category?: "personal" | "account" | "address" | "other";
}
```

**Example Field Definitions** (Wealth Management Domain):

```typescript
const CUSTOMER_FIELDS: DataField[] = [
  // Personal Information
  {
    id: "full_name",
    label: "Full Name",
    type: "text",
    description: "Customer's full legal name",
    category: "personal",
  },
  {
    id: "date_of_birth",
    label: "Date of Birth",
    type: "date",
    formatConfig: {
      dateFormat: "dd MMMM yyyy", // Default: "10 March 1985"
    },
    description: "Customer's date of birth",
    category: "personal",
  },
  {
    id: "tax_id",
    label: "Tax ID",
    type: "text",
    description: "National tax identification number",
    category: "personal",
  },

  // Account Information
  {
    id: "sort_code",
    label: "Sort Code",
    type: "text",
    formatConfig: {
      pattern: "##-##-##", // Custom pattern
    },
    description: "Bank sort code",
    category: "account",
  },
  {
    id: "account_number",
    label: "Account Number",
    type: "text",
    description: "Bank account number",
    category: "account",
  },
  {
    id: "account_balance",
    label: "Account Balance",
    type: "currency",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 2,
    },
    description: "Current account balance",
    category: "account",
  },
  {
    id: "account_type",
    label: "Account Type",
    type: "text",
    description: "Type of account (e.g., Savings, Investment, Pension)",
    category: "account",
  },
  {
    id: "client_since_date",
    label: "Client Since Date",
    type: "date",
    formatConfig: {
      dateFormat: "dd MMMM yyyy",
    },
    description: "Date customer became a client",
    category: "account",
  },
  {
    id: "client_status",
    label: "Client Status",
    type: "text",
    description: "Current client status (Active, Inactive, VIP)",
    category: "account",
  },

  // Wealth Management Specific
  {
    id: "portfolio_value",
    label: "Portfolio Value",
    type: "currency",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 2,
    },
    description: "Total value of investment portfolio",
    category: "account",
  },
  {
    id: "investment_advisor_name",
    label: "Investment Advisor Name",
    type: "text",
    description: "Name of assigned wealth advisor",
    category: "account",
  },
  {
    id: "risk_profile",
    label: "Risk Profile",
    type: "text",
    description:
      "Investment risk tolerance (Conservative, Moderate, Aggressive)",
    category: "account",
  },
  {
    id: "annual_income",
    label: "Annual Income",
    type: "currency",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 0,
    },
    description: "Declared annual income",
    category: "account",
  },
  {
    id: "net_worth",
    label: "Net Worth",
    type: "currency",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 0,
    },
    description: "Estimated total net worth",
    category: "account",
  },
  {
    id: "last_review_date",
    label: "Last Review Date",
    type: "date",
    formatConfig: {
      dateFormat: "dd MMMM yyyy",
    },
    description: "Date of last portfolio review",
    category: "account",
  },
  {
    id: "next_review_date",
    label: "Next Review Date",
    type: "date",
    formatConfig: {
      dateFormat: "dd MMMM yyyy",
    },
    description: "Scheduled date for next review",
    category: "account",
  },

  // Contact Information
  {
    id: "primary_contact_phone",
    label: "Primary Contact Phone",
    type: "text",
    formatConfig: {
      pattern: "(###) ###-####",
    },
    description: "Primary phone number",
    category: "address",
  },
  {
    id: "primary_contact_email",
    label: "Primary Contact Email",
    type: "text",
    description: "Primary email address",
    category: "address",
  },
  {
    id: "preferred_contact_method",
    label: "Preferred Contact Method",
    type: "text",
    description: "Preferred way to contact (Phone, Email, Post)",
    category: "address",
  },

  // Address Information
  {
    id: "mailing_address",
    label: "Mailing Address",
    type: "text",
    description: "Street address for correspondence",
    category: "address",
  },
  {
    id: "city",
    label: "City",
    type: "text",
    description: "City name",
    category: "address",
  },
  {
    id: "postal_code",
    label: "Postal Code",
    type: "text",
    description: "Postal/ZIP code",
    category: "address",
  },
  {
    id: "country",
    label: "Country",
    type: "text",
    description: "Country name",
    category: "address",
  },
];

// Total: 27 wealth management fields for MVP
```

**TipTap Pill Representation**:

```html
<!-- How pills appear in editor DOM -->
<span
  data-type="pill"
  data-field-id="full_name"
  class="pill-node"
  contenteditable="false"
>
  Full Name
</span>
```

**Markdown Serialization**:

```markdown
Dear {{title}} {{last_name}},

Your account balance is {{balance}}.
```

---

### 3. CustomerRecord

Actual customer data that populates template fields during preview/generation.

```typescript
interface CustomerRecord {
  /** Unique customer identifier */
  id: string;

  /** Dynamic properties matching DataField IDs */
  [fieldId: string]: string | number | Date | null | undefined;

  /** Wealth Management Fields (27 total) */
  // Personal
  full_name?: string;
  date_of_birth?: string; // ISO 8601 date string
  tax_id?: string;

  // Account
  sort_code?: string;
  account_number?: string;
  account_balance?: number;
  account_type?: string;
  client_since_date?: string;
  client_status?: string;

  // Wealth Management
  portfolio_value?: number;
  investment_advisor_name?: string;
  risk_profile?: string;
  annual_income?: number;
  net_worth?: number;
  last_review_date?: string;
  next_review_date?: string;

  // Contact
  primary_contact_phone?: string;
  primary_contact_email?: string;
  preferred_contact_method?: string;

  // Address
  mailing_address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}
```

**Example Data** (loaded from JSON for MVP, AG-Grid integration deferred):

```typescript
const sampleCustomers: CustomerRecord[] = [
  {
    id: "CUST001",
    // Personal Information
    full_name: "Adrian Sterling",
    date_of_birth: "1985-03-10",
    tax_id: "AB123456C",

    // Account Information
    sort_code: "20-00-00",
    account_number: "12345678",
    account_balance: 5000.0,
    account_type: "Investment Account",
    client_since_date: "2015-06-01",
    client_status: "VIP",

    // Wealth Management
    portfolio_value: 250000.0,
    investment_advisor_name: "Sarah Johnson",
    risk_profile: "Moderate",
    annual_income: 85000,
    net_worth: 450000,
    last_review_date: "2025-12-15",
    next_review_date: "2026-06-15",

    // Contact Information
    primary_contact_phone: "(020) 7946-0958",
    primary_contact_email: "adrian.sterling@example.com",
    preferred_contact_method: "Email",

    // Address
    mailing_address: "123 Kensington High Street",
    city: "London",
    postal_code: "W8 5SA",
    country: "United Kingdom",
  },
  {
    id: "CUST002",
    // Personal Information
    full_name: "Marie Curie",
    date_of_birth: "1990-11-07",
    tax_id: "MC987654D",

    // Account Information
    sort_code: "20-00-00",
    account_number: "87654321",
    account_balance: 12000.0,
    account_type: "Pension Fund",
    client_since_date: "2018-03-15",
    client_status: "Active",

    // Wealth Management
    portfolio_value: 500000.0,
    investment_advisor_name: "James Mitchell",
    risk_profile: "Conservative",
    annual_income: 120000,
    net_worth: 750000,
    last_review_date: "2026-01-20",
    next_review_date: "2026-07-20",

    // Contact Information
    primary_contact_phone: "(020) 7123-4567",
    primary_contact_email: "marie.curie@example.com",
    preferred_contact_method: "Phone",

    // Address
    mailing_address: "45 Oxford Street",
    city: "London",
    postal_code: "W1D 1BS",
    country: "United Kingdom",
  },
  {
    id: "CUST003",
    // Personal Information
    full_name: "Robert Chen",
    date_of_birth: "1978-05-22",
    tax_id: null, // Missing value example

    // Account Information
    sort_code: "40-47-84",
    account_number: "55443322",
    account_balance: 75000.0,
    account_type: "Savings Account",
    client_since_date: "2010-09-12",
    client_status: "Active",

    // Wealth Management
    portfolio_value: 1200000.0,
    investment_advisor_name: "Emma Thompson",
    risk_profile: "Aggressive",
    annual_income: 200000,
    net_worth: 1500000,
    last_review_date: "2026-02-28",
    next_review_date: "2026-08-28",

    // Contact Information
    primary_contact_phone: "(020) 8765-4321",
    primary_contact_email: "robert.chen@example.com",
    preferred_contact_method: "Email",

    // Address
    mailing_address: "78 Canary Wharf",
    city: "London",
    postal_code: "E14 5AB",
    country: "United Kingdom",
  },
];
```

**Missing Value Handling** (per spec clarification):

```typescript
const customer: CustomerRecord = {
  id: "CUST003",
  full_name: "John Doe",
  date_of_birth: null, // Missing value
};

// In preview:
// {{date_of_birth}} → "(Not Available)" or blank space
```

---

### 4. FieldFormatConfig

Configuration for how data fields are displayed when merged into documents.

```typescript
type FieldFormatConfig =
  | TextFormatConfig
  | DateFormatConfig
  | NumberFormatConfig
  | CurrencyFormatConfig;

interface TextFormatConfig {
  /** Optional pattern (e.g., "##-##-##" for sort code) */
  pattern?: string;

  /** Text transform */
  transform?: "uppercase" | "lowercase" | "capitalize" | "none";
}

interface DateFormatConfig {
  /** Date format string (date-fns format tokens) */
  dateFormat: string;

  /** Examples:
   * 'dd MMM yyyy' → "10 Mar 2026"
   * 'MM/dd/yyyy' → "03/10/2026"
   * 'yyyy-MM-dd' → "2026-03-10"
   * 'EEEE, MMMM do, yyyy' → "Monday, March 10th, 2026"
   */
}

interface NumberFormatConfig {
  /** Number of decimal places */
  decimals: number;

  /** Thousand separator */
  thousandSeparator?: "," | "." | " " | "none";
}

interface CurrencyFormatConfig {
  /** ISO 4217 currency code */
  currencyCode: "GBP" | "EUR" | "USD";

  /** Decimal places (default: 2) */
  decimals?: number;

  /** Symbol position */
  symbolPosition?: "before" | "after";

  /** Examples:
   * { currencyCode: 'GBP', decimals: 2 } → "£5,000.00"
   * { currencyCode: 'EUR', decimals: 2, symbolPosition: 'after' } → "5.000,00 €"
   */
}
```

**Default Formats** (used when no config specified):

```typescript
const DEFAULT_FORMATS: Record<DataField["type"], any> = {
  text: { transform: "none" },
  date: { dateFormat: "dd MMM yyyy" }, // "10 Mar 2026" (per clarification)
  number: { decimals: 0, thousandSeparator: "," },
  currency: { currencyCode: "GBP", decimals: 2, symbolPosition: "before" },
};
```

---

## Entity Relationships

```
┌─────────────────────┐
│  DocumentTemplate   │
│  - id               │
│  - name             │
│  - content ────────┐│  (contains {{field_id}} placeholders)
│  - createdAt       ││
│  - updatedAt       ││
└─────────────────────┘│
                       │
                       │ references
                       ↓
         ┌─────────────────────┐
         │     DataField       │
         │  - id               │
         │  - label            │
         │  - type             │
         │  - formatConfig ────┼──→ FieldFormatConfig
         └─────────────────────┘
                   ↑
                   │ defines structure
                   │
         ┌─────────────────────┐
         │   CustomerRecord    │
         │  - id               │
         │  - [fieldId]        │  (dynamic properties)
         └─────────────────────┘
                   │
                   │ selected in AG-Grid
                   ↓
         ┌─────────────────────┐
         │  MergedDocument     │  (runtime only, not persisted)
         │  - templateId       │
         │  - customerId       │
         │  - renderedHtml     │
         └─────────────────────┘
```

---

## Data Flow

### Template Creation Flow

1. **User Types** → TipTap editor emits `content` events
2. **User Triggers** `[` or `{{` → TipTap input rule activated
3. **Pill Menu Shown** → List of available DataFields
4. **User Selects Field** → Insert PillNode with `fieldId`
5. **Editor Serializes** → Markdown with `{{field_id}}` syntax
6. **Save Template** → Store DocumentTemplate in localStorage

### Preview Generation Flow

1. **User Selects Row** in AG-Grid → Emit CustomerRecord
2. **Template Updated** or **Row Changed** → Trigger preview update
3. **Interpolation Service**:

   ```typescript
   function interpolate(
     markdown: string,
     customer: CustomerRecord,
     fields: DataField[],
   ): string {
     return markdown.replace(/\{\{(\w+)\}\}/g, (match, fieldId) => {
       const field = fields.find((f) => f.id === fieldId);
       const value = customer[fieldId];

       if (value === null || value === undefined) {
         return "(Not Available)"; // Per clarification
       }

       return formatValue(value, field?.formatConfig);
     });
   }
   ```

4. **Markdown Rendering** → `marked.parse(interpolatedMarkdown)`
5. **Display HTML** → Render in preview pane

---

## Storage Limits & Constraints

### localStorage Constraints

- **Browser Limit**: 5-10 MB per origin (varies by browser)
- **Per Template**: ~10-25 KB (content + metadata)
- **Capacity**: ~200-500 templates before hitting limits
- **Mitigation**: Provide download/upload for backup

### Template Size Limits

- **Content**: Max 50,000 characters (practical limit for editing UX)
- **Name**: Max 100 characters
- **Metadata Description**: Max 500 characters

### Customer Data Limits

- **AG-Grid**: Handles 1000+ rows efficiently with virtual scrolling
- **No Persistence**: Customer data loaded from external source (not stored in
  feature)

---

## Validation & Constraints

### Template Validation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

function validateTemplate(template: DocumentTemplate): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!template.name || template.name.length === 0) {
    errors.push({
      code: "EMPTY_NAME",
      message: "Template name cannot be empty",
    });
  }
  if (template.name.length > 100) {
    errors.push({
      code: "NAME_TOO_LONG",
      message: "Template name must be ≤100 characters",
    });
  }

  // Content validation
  if (template.content.length > 50000) {
    errors.push({
      code: "CONTENT_TOO_LONG",
      message: "Template content must be ≤50,000 characters",
    });
  }

  // Validate all {{field_id}} references exist
  const fieldRefs = extractFieldReferences(template.content);
  const invalidRefs = fieldRefs.filter((ref) => !isValidFieldId(ref));
  if (invalidRefs.length > 0) {
    errors.push({
      code: "INVALID_FIELD_REF",
      message: `Unknown fields referenced: ${invalidRefs.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## Migration Strategy

### Version 1 Schema

Current schema with `version: 1` in DocumentTemplate.

**Future Migrations**:

```typescript
interface Migration {
  from: number;
  to: number;
  migrate: (data: any) => any;
}

const migrations: Migration[] = [
  {
    from: 1,
    to: 2,
    migrate: (template: any) => {
      // Example: Add new fields in version 2
      return {
        ...template,
        version: 2,
        // New fields here
      };
    },
  },
];

function migrateTemplate(template: DocumentTemplate): DocumentTemplate {
  let current = template;
  while (current.version < LATEST_VERSION) {
    const migration = migrations.find((m) => m.from === current.version);
    if (!migration) break;
    current = migration.migrate(current);
  }
  return current;
}
```

---

## Type Exports

All types are exported from `src/app/template-assistant/models/`:

```typescript
// src/app/template-assistant/models/index.ts
export * from "./template.model";
export * from "./data-field.model";
export * from "./customer-record.model";
export * from "./field-format.model";
```

**Usage in Components**:

```typescript
import {
  DocumentTemplate,
  DataField,
  CustomerRecord,
  FieldFormatConfig,
} from "../models";
```
