# Data Model: Configuration Manager

**Feature**: Configuration Manager  
**Phase**: 1 - Entity Definitions & Relationships  
**Date**: 2026-02-02

## Entity Relationship Diagram

```
┌─────────────────────────────────┐
│         Basket                  │
│─────────────────────────────────│
│ + id: number (PK)               │
│ + name: string (unique)         │
│ + configurationIds: number[]    │───┐
│ + createdDate: Date             │   │
│ + createdBy: string             │   │
│ + lastModifiedDate: Date        │   │
│ + lastModifiedBy: string        │   │
└─────────────────────────────────┘   │
                                      │
                                      │ N..M
                                      │
┌─────────────────────────────────┐   │
│      Configuration              │   │
│─────────────────────────────────│   │
│ + id: number (PK)               │◄──┘
│ + name: string                  │
│ + type: ConfigurationType       │◄──┐
│ + version: string               │   │
│ + value: string                 │   │
│ + updates: UpdateEntry[]        │───┤
│ + createdDate: Date             │   │
│ + createdBy: string             │   │
│ + lastModifiedDate: Date        │   │
│ + lastModifiedBy: string        │   │
└─────────────────────────────────┘   │
                                      │
                                      │ 1..N
                                      │
                        ┌─────────────┴──────────────┐
                        │      UpdateEntry           │
                        │────────────────────────────│
                        │ + jiraTicket?: string      │
                        │ + comment?: string         │
                        │ + date: Date               │
                        │ + madeBy: string           │
                        └────────────────────────────┘

┌─────────────────────────────────┐
│   ConfigurationType (enum)      │
│─────────────────────────────────│
│ DASHBOARD_CONFIG                │
│ FORM_CONFIG                     │
│ FETCH_XML_QUERY                 │
│ DASHBOARD_QUERY                 │
│ PROCESS                         │
│ SYSTEM_SETTINGS                 │
└─────────────────────────────────┘
```

## Entity Definitions

### Basket

**Purpose**: Represents a collection of configurations for a specific
environment or use case (e.g., "Product (core)", "UAT", "Staging").

**TypeScript Interface**:

```typescript
interface Basket {
  /** Unique numeric identifier (auto-generated) */
  id: number;

  /** User-friendly name for the basket (unique across all baskets) */
  name: string;

  /** Array of configuration IDs belonging to this basket */
  configurationIds: number[];

  /** Timestamp when basket was created */
  createdDate: Date;

  /** Full name of user who created the basket */
  createdBy: string;

  /** Timestamp of last modification */
  lastModifiedDate: Date;

  /** Full name of user who last modified the basket */
  lastModifiedBy: string;
}
```

**Validation Rules**:

- `id`: Auto-generated, unique, positive integer
- `name`: Required, 1-50 characters, must be unique across all baskets
- `configurationIds`: Array can be empty, all IDs must reference existing
  configurations
- `createdDate`: Auto-generated on creation
- `createdBy`: Required, from authenticated user context
- `lastModifiedDate`: Auto-updated on any modification
- `lastModifiedBy`: Updated from authenticated user context

**Business Rules**:

- Default basket "Product (core)" is auto-created on first use
- Basket names must be unique (case-insensitive comparison)
- A configuration can belong to multiple baskets
- Deleting a basket with configurations requires either:
  - Moving configurations to another basket, or
  - Force delete flag (with user confirmation)
- Basket modifications update `lastModifiedDate` and `lastModifiedBy`

---

### Configuration

**Purpose**: Represents a single configuration with metadata and content value.

**TypeScript Interface**:

```typescript
interface Configuration {
  /** Unique numeric identifier (auto-generated) */
  id: number;

  /** User-friendly name for the configuration */
  name: string;

  /** Type/category of configuration */
  type: ConfigurationType;

  /** Version string in format V#.#.# (e.g., V1.0.0) */
  version: string;

  /** The actual configuration content (JSON/FetchXML/text based on type) */
  value: string;

  /** Array of update history entries */
  updates: UpdateEntry[];

  /** Timestamp when configuration was first created */
  createdDate: Date;

  /** Full name of user who created the configuration */
  createdBy: string;

  /** Timestamp of last modification */
  lastModifiedDate: Date;

  /** Full name of user who last modified the configuration */
  lastModifiedBy: string;
}
```

**Validation Rules**:

- `id`: Auto-generated, unique, positive integer
- `name`: Required, 1-100 characters, must be unique per type
- `type`: Required, must be one of ConfigurationType enum values
- `version`: Required, must match pattern `/^V\d+\.\d+\.\d+$/`
- `value`: Required, must be valid according to type:
  - JSON types: Valid JSON (parseable)
  - FetchXML types: Valid XML with `<fetch>` root element
  - Text types: Any string
- `updates`: Array can be empty for new configurations
- `createdDate`, `lastModifiedDate`: Valid Date objects
- `createdBy`, `lastModifiedBy`: Required, 1-100 characters

**State Transitions**:

1. **New** → `id` generated, `createdDate` set, `updates` empty
2. **Edit** → `lastModifiedDate` updated, new UpdateEntry added to `updates[]`
3. **Export** → Serialized to ZIP structure
4. **Import** → Deserialized from ZIP, conflict detection if ID exists

**IndexedDB Storage**:

```typescript
// Object store name: 'configurations'
// Key path: 'id'
// Indexes:
//   - name (unique: false)
//   - type (unique: false)
//   - version (unique: false)
//   - lastModifiedDate (unique: false)
```

---

### ConfigurationType

**Purpose**: Enum defining the six supported configuration types, determining
format and editor.

**TypeScript Enum**:

```typescript
enum ConfigurationType {
  DASHBOARD_CONFIG = "Dashboard config (JSON)",
  FORM_CONFIG = "Form config (JSON)",
  FETCH_XML_QUERY = "Fetch XML queries (FetchXML)",
  DASHBOARD_QUERY = "Dashboard queries (FetchXML)",
  PROCESS = "Processes (JSON)",
  SYSTEM_SETTINGS = "System Settings (JSON)",
}
```

**Editor Mapping**: | Type | Format | Editor | File Extension |
|------|--------|--------|----------------| | DASHBOARD_CONFIG | JSON |
JSONEditor | .json | | FORM_CONFIG | JSON | JSONEditor | .json | |
FETCH_XML_QUERY | FetchXML | Ace Editor (XML mode) | .xml | | DASHBOARD_QUERY |
FetchXML | Ace Editor (XML mode) | .xml | | PROCESS | JSON | JSONEditor | .json
| | SYSTEM_SETTINGS | JSON | JSONEditor | .json |

**Helper Functions**:

```typescript
function isJsonType(type: ConfigurationType): boolean {
  return [
    ConfigurationType.DASHBOARD_CONFIG,
    ConfigurationType.FORM_CONFIG,
    ConfigurationType.PROCESS,
    ConfigurationType.SYSTEM_SETTINGS,
  ].includes(type);
}

function isFetchXmlType(type: ConfigurationType): boolean {
  return [
    ConfigurationType.FETCH_XML_QUERY,
    ConfigurationType.DASHBOARD_QUERY,
  ].includes(type);
}

function getFileExtension(type: ConfigurationType): string {
  return isJsonType(type) ? "json" : "xml";
}

function getEditorType(type: ConfigurationType): "json" | "xml" | "text" {
  if (isJsonType(type)) return "json";
  if (isFetchXmlType(type)) return "xml";
  return "text";
}
```

---

### UpdateEntry

**Purpose**: Represents a single change/update to a configuration with audit
trail information.

**TypeScript Interface**:

```typescript
interface UpdateEntry {
  /** Optional Jira ticket reference (format: WPO-#####) */
  jiraTicket?: string;

  /** Markdown-formatted comment explaining the change (mandatory if jiraTicket is empty) */
  comment?: string;

  /** Date of the update */
  date: Date;

  /** Full name of team member who made the update */
  madeBy: string;
}
```

**Validation Rules**:

- At least one of `jiraTicket` OR `comment` MUST be present
- `jiraTicket`: If present, must match pattern `/^WPO-\d{5}$/` (e.g., WPO-12344)
- `comment`: If present, 1-5000 characters, markdown-formatted
- `date`: Required, valid Date object, cannot be in future
- `madeBy`: Required, must be from predefined team member list

**Validation Logic**:

```typescript
function validateUpdateEntry(entry: UpdateEntry): {
  valid: boolean;
  error?: string;
} {
  // Check mutual exclusivity rule
  if (!entry.jiraTicket && !entry.comment) {
    return { valid: false, error: "Either Jira ticket or comment is required" };
  }

  // Validate Jira ticket format if present
  if (entry.jiraTicket && !/^WPO-\d{5}$/.test(entry.jiraTicket)) {
    return {
      valid: false,
      error: "Jira ticket must match format WPO-##### (e.g., WPO-12344)",
    };
  }

  // Validate comment length if present
  if (
    entry.comment &&
    (entry.comment.length < 1 || entry.comment.length > 5000)
  ) {
    return { valid: false, error: "Comment must be between 1-5000 characters" };
  }

  // Validate date
  if (entry.date > new Date()) {
    return { valid: false, error: "Update date cannot be in the future" };
  }

  return { valid: true };
}
```

**Sorting**:

```typescript
// Default sort: Most recent first
updates.sort((a, b) => b.date.getTime() - a.date.getTime());
```

---

### ExportPackage

**Purpose**: Defines the structure of exported ZIP archives for configurations.

**ZIP Structure**:

```
configurations-[timestamp].zip
├── config-1/
│   ├── metadata.json      # Configuration metadata (excluding value)
│   └── value.json         # Configuration value content
├── config-2/
│   ├── metadata.json
│   └── value.xml          # FetchXML type uses .xml extension
├── config-3/
│   ├── metadata.json
│   └── value.json
└── manifest.json          # Export manifest with timestamp, version
```

**Metadata File Format** (`metadata.json`):

```json
{
  "id": 123,
  "name": "Main Dashboard Config",
  "type": "Dashboard config (JSON)",
  "version": "V1.2.3",
  "updates": [
    {
      "jiraTicket": "WPO-12344",
      "comment": "Fixed layout issue",
      "date": "2026-02-02T10:30:00.000Z",
      "madeBy": "John Smith"
    }
  ],
  "createdDate": "2026-01-15T09:00:00.000Z",
  "createdBy": "Jane Doe",
  "lastModifiedDate": "2026-02-02T10:30:00.000Z",
  "lastModifiedBy": "John Smith"
}
```

**Value File**: Contains the raw configuration value (value.json or value.xml)

**Manifest File** (`manifest.json`):

```json
{
  "exportVersion": "1.0",
  "exportDate": "2026-02-02T11:00:00.000Z",
  "exportedBy": "John Smith",
  "configurationsCount": 3,
  "configurations": [
    { "id": 1, "name": "Main Dashboard Config" },
    { "id": 2, "name": "User Form Config" },
    { "id": 3, "name": "Account Query" }
  ]
}
```

**TypeScript Interface**:

```typescript
interface ExportPackage {
  exportVersion: string;
  exportDate: Date;
  exportedBy: string;
  configurations: ExportedConfiguration[];
}

interface ExportedConfiguration {
  metadata: Omit<Configuration, "value">;
  value: string;
  folder: string; // e.g., "config-1"
}
```

---

### ConflictDetection

**Purpose**: Data structure for import conflict detection and resolution.

**TypeScript Interface**:

```typescript
interface ImportConflict {
  /** Configuration from imported ZIP */
  imported: Configuration;

  /** Existing configuration in database with same ID */
  existing: Configuration;

  /** Detected differences */
  differences: ConflictDifference[];

  /** User's resolution choice */
  resolution?: ConflictResolution;
}

interface ConflictDifference {
  field: keyof Configuration | "value";
  existingValue: any;
  importedValue: any;
  differenceType: "metadata" | "content";
}

enum ConflictResolution {
  OVERWRITE = "overwrite", // Replace existing with imported
  KEEP_EXISTING = "keep", // Discard imported, keep existing
  IMPORT_AS_NEW = "new", // Import with new auto-generated ID
}
```

**Conflict Detection Logic**:

```typescript
function detectConflicts(
  imported: Configuration[],
  existing: Configuration[],
): ImportConflict[] {
  const conflicts: ImportConflict[] = [];
  const existingMap = new Map(existing.map((c) => [c.id, c]));

  imported.forEach((importedConfig) => {
    const existingConfig = existingMap.get(importedConfig.id);

    if (existingConfig) {
      const differences = findDifferences(importedConfig, existingConfig);
      if (differences.length > 0) {
        conflicts.push({
          imported: importedConfig,
          existing: existingConfig,
          differences,
        });
      }
    }
  });

  return conflicts;
}

function findDifferences(
  imported: Configuration,
  existing: Configuration,
): ConflictDifference[] {
  const differences: ConflictDifference[] = [];

  // Check metadata fields
  const metadataFields: (keyof Configuration)[] = [
    "name",
    "type",
    "version",
    "updates",
  ];

  metadataFields.forEach((field) => {
    const importedVal = JSON.stringify(imported[field]);
    const existingVal = JSON.stringify(existing[field]);

    if (importedVal !== existingVal) {
      differences.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        differenceType: "metadata",
      });
    }
  });

  // Check content value
  if (imported.value !== existing.value) {
    differences.push({
      field: "value",
      existingValue: existing.value,
      importedValue: imported.value,
      differenceType: "content",
    });
  }

  return differences;
}
```

---

## State Management (Signals)

### ConfigurationStore

**Purpose**: Manages global configuration state using @ngrx/signals.

**Store Definition**:

```typescript
export const ConfigurationStore = signalStore(
  { providedIn: "root" },

  withState({
    configurations: [] as Configuration[],
    selectedIds: [] as number[],
    loading: false,
    error: null as string | null,
    filterType: null as ConfigurationType | null,
    searchTerm: "",
  }),

  withComputed((store) => ({
    filteredConfigurations: computed(() => {
      let result = store.configurations();

      // Apply type filter
      if (store.filterType()) {
        result = result.filter((c) => c.type === store.filterType());
      }

      // Apply search term
      if (store.searchTerm()) {
        const term = store.searchTerm().toLowerCase();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.id.toString().includes(term),
        );
      }

      return result;
    }),

    selectedConfigurations: computed(() =>
      store.configurations().filter((c) => store.selectedIds().includes(c.id)),
    ),
  })),

  withMethods((store, configService = inject(ConfigurationService)) => ({
    loadAll: () => {
      patchState(store, { loading: true });
      configService.getAll().subscribe({
        next: (configurations) =>
          patchState(store, {
            configurations,
            loading: false,
          }),
        error: (error) =>
          patchState(store, {
            error: error.message,
            loading: false,
          }),
      });
    },

    save: (config: Configuration) => {
      configService.save(config).subscribe({
        next: (saved) => {
          const existing = store
            .configurations()
            .findIndex((c) => c.id === saved.id);
          if (existing >= 0) {
            // Update
            const updated = [...store.configurations()];
            updated[existing] = saved;
            patchState(store, { configurations: updated });
          } else {
            // Add new
            patchState(store, {
              configurations: [...store.configurations(), saved],
            });
          }
        },
      });
    },

    delete: (id: number) => {
      configService.delete(id).subscribe(() => {
        patchState(store, {
          configurations: store.configurations().filter((c) => c.id !== id),
          selectedIds: store.selectedIds().filter((sid) => sid !== id),
        });
      });
    },

    setSelection: (ids: number[]) => patchState(store, { selectedIds: ids }),
    setFilterType: (type: ConfigurationType | null) =>
      patchState(store, { filterType: type }),
    setSearchTerm: (term: string) => patchState(store, { searchTerm: term }),
  })),
);
```

---

## Data Flow Diagrams

### Create/Edit Flow

```
User → ConfigurationManager → ConfigurationEditor → Editor (JSON/Ace)
                                       ↓
                              ConfigurationService.save()
                                       ↓
                            ConfigurationStorageService (IndexedDB)
                                       ↓
                              ConfigurationStore.save()
                                       ↓
                              ConfigurationGrid (refresh)
```

### Export Flow

```
User selects → ConfigurationGrid → ConfigurationStore.selectedConfigurations
                                           ↓
                              ConfigurationExportService.export()
                                           ↓
                                    JSZip.generate()
                                           ↓
                                  FileSaver.saveAs()
                                           ↓
                                  Browser downloads ZIP
```

### Import Flow

```
User uploads ZIP → ImportWizard → ConfigurationImportService.import()
                                           ↓
                                   JSZip.loadAsync()
                                           ↓
                                Parse metadata + value
                                           ↓
                              Conflict detection (by ID)
                                           ↓
                      ConflictComparisonComponent (if conflicts)
                                           ↓
                            User chooses resolution
                                           ↓
                  ConfigurationStore.save() (with resolution applied)
```

---

## Summary

**Total Entities**: 5

- Configuration (main entity)
- ConfigurationType (enum)
- UpdateEntry (nested in Configuration)
- ExportPackage (serialization format)
- ImportConflict (conflict resolution)

**Relationships**:

- Configuration `1:N` UpdateEntry
- Configuration `N:1` ConfigurationType

**Storage**:

- Primary: IndexedDB (`configurations` object store)
- Indexes: name, type, version, lastModifiedDate
- Key: id (auto-increment)

**State Management**:

- @ngrx/signals for reactive state
- Computed selectors for filtering/search
- Centralized configuration store
