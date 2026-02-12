# Data Model: ag-Grid with ng-select Cell Demo

**Feature**: ag-Grid with ng-select Cell Demo  
**Date**: February 11, 2026  
**Phase**: Phase 1 - Data Model Definition

## Entities

### GridRow

Represents a single row of test data in the demonstration grid.

**Purpose**: Container for all column values including the dropdown selector
field

**Fields**:

| Field         | Type   | Description                     | Validation                            | Example             |
| ------------- | ------ | ------------------------------- | ------------------------------------- | ------------------- |
| id            | number | Unique row identifier           | Required, positive integer            | 1                   |
| name          | string | Full name (person)              | Required, 3-50 chars                  | "John Smith"        |
| email         | string | Email address                   | Required, email format                | "user1@example.com" |
| status        | string | Status value (ng-select column) | Required, must be from StatusOption[] | "Active"            |
| department    | string | Department name                 | Required                              | "Engineering"       |
| location      | string | Office location                 | Required                              | "New York"          |
| role          | string | Job role                        | Required                              | "Developer"         |
| startDate     | string | Start date (ISO format)         | Required, valid date                  | "2024-01-15"        |
| salary        | number | Salary amount                   | Required, positive                    | 75000               |
| performance   | string | Performance rating              | Required                              | "Excellent"         |
| projects      | number | Project count                   | Required, non-negative                | 3                   |
| hoursLogged   | number | Hours logged this month         | Required, non-negative                | 160                 |
| certification | string | Certification status            | Required                              | "Certified"         |
| experience    | number | Years of experience             | Required, non-negative                | 5                   |
| team          | string | Team assignment                 | Required                              | "Platform"          |

**Relationships**: None (flat data structure for demo)

**State Transitions**:

- status field can change from any value to any other status value via dropdown
  selection
- All other fields are read-only in this demo

---

### StatusOption

Represents an available option in the status dropdown selector.

**Purpose**: Define the selectable values for the ng-select dropdown

**Fields**:

| Field | Type   | Description       | Example  |
| ----- | ------ | ----------------- | -------- |
| id    | string | unique identifier | "active" |
| label | string | Display text      | "Active" |

**Values** (Static):

```typescript
const statusOptions: StatusOption[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "inactive", label: "Inactive" },
  { id: "suspended", label: "Suspended" },
  { id: "archived", label: "Archived" },
];
```

---

### ColumnDefinition

Represents the configuration for each grid column (internal to ag-Grid).

**Purpose**: Configure how each column is displayed and which cell renderer to
use

**Key Properties**:

| Property     | Type                   | Description              | Example                       |
| ------------ | ---------------------- | ------------------------ | ----------------------------- |
| field        | string                 | Property name in GridRow | "status"                      |
| headerName   | string                 | Column header text       | "Status (ng-select)"          |
| width        | number                 | Column width in pixels   | 110                           |
| cellRenderer | Component \| undefined | Custom cell renderer     | NgSelectCellRendererComponent |
| sortable     | boolean                | Enable sorting           | true                          |
| filter       | boolean                | Enable filtering         | true                          |
| resizable    | boolean                | Enable column resize     | true                          |

---

## Data Flow

### Initialization Flow

```
1. Component ngOnInit()
   ↓
2. MockDataService.generate(100)
   ↓
3. Create GridRow[] (100 items)
   ↓
4. Assign to component.rowData
   ↓
5. ag-Grid renders rows with column definitions
   ↓
6. For 'status' column → NgSelectCellRendererComponent instantiated per row
```

### Selection Update Flow

```
1. User clicks ng-select cell
   ↓
2. NgSelectCellRendererComponent dropdown opens
   ↓
3. User selects new StatusOption
   ↓
4. Component.onSelectionChange(newValue)
   ↓
5. params.setValue(newValue) → Updates GridRow.status
   ↓
6. ag-Grid internal state updated
   ↓
7. Cell displays new value
```

### Persistence Flow

```
1. User scrolls grid (virtual scrolling)
   ↓
2. ag-Grid reuses cell renderer components
   ↓
3. agInit(params) called with updated row data
   ↓
4. Component reflects current GridRow.status value
   ↓
5. Previous selection persists in underlying data model
```

---

## Validation Rules

### GridRow Validation

- All fields required (no null/undefined values)
- id must be unique across all rows
- email must match email pattern (basic validation)
- status must be a valid StatusOption.label value
- Numeric fields must be non-negative

### StatusOption Validation

- id must be unique across options
- label must be non-empty string
- At least 5 options required (per spec FR-004)

---

## Data Generation Rules

Implemented in `MockDataService`:

```typescript
class MockDataService {
  generate(rowCount: number): GridRow[] {
    const statusOptions = [
      "Active",
      "Pending",
      "Inactive",
      "Suspended",
      "Archived",
    ];
    const firstNames = [
      "John",
      "Jane",
      "Bob",
      "Alice",
      "Charlie",
      "Diana",
      "Eve",
      "Frank",
    ];
    const lastNames = [
      "Smith",
      "Doe",
      "Johnson",
      "Williams",
      "Brown",
      "Davis",
      "Miller",
      "Wilson",
    ];
    const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];
    const locations = ["New York", "London", "Tokyo", "Sydney", "Berlin"];
    const roles = ["Developer", "Manager", "Analyst", "Designer", "Consultant"];
    const performances = ["Excellent", "Good", "Average", "Needs Improvement"];
    const certifications = ["Certified", "In Progress", "Not Required"];
    const teams = ["Platform", "Product", "Infrastructure", "Data", "Security"];

    return Array.from({ length: rowCount }, (_, i) => ({
      id: i + 1,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      email: `user${i + 1}@example.com`,
      status: statusOptions[i % statusOptions.length],
      department: departments[i % departments.length],
      location: locations[i % locations.length],
      role: roles[i % roles.length],
      startDate: new Date(2020 + (i % 5), i % 12, (i % 28) + 1)
        .toISOString()
        .split("T")[0],
      salary: 50000 + (i % 10) * 10000,
      performance: performances[i % performances.length],
      projects: (i % 8) + 1,
      hoursLogged: 120 + (i % 80),
      certification: certifications[i % certifications.length],
      experience: (i % 15) + 1,
      team: teams[i % teams.length],
    }));
  }
}
```

---

## Type Definitions

**TypeScript Interfaces**:

```typescript
// models/grid-row.interface.ts
export interface GridRow {
  id: number;
  name: string;
  email: string;
  status: string;
  department: string;
  location: string;
  role: string;
  startDate: string;
  salary: number;
  performance: string;
  projects: number;
  hoursLogged: number;
  certification: string;
  experience: number;
  team: string;
}

// models/status-option.interface.ts
export interface StatusOption {
  id: string;
  label: string;
}
```

---

## Summary

- **3 entities**: GridRow (main data), StatusOption (dropdown values),
  ColumnDefinition (grid config)
- **15 fields** per GridRow to meet spec requirement
- **5 status options** to meet spec requirement (FR-004)
- **Flat structure**: No relationships, ideal for demo/testing
- **In-memory**: All data generated on init, no persistence
- **Deterministic**: Modulo-based generation for predictable test data
