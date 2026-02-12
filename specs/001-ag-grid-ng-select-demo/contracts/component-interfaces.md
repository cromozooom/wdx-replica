# Component Interface Contract: ag-Grid with ng-select Cell Demo

**Feature**: ag-Grid with ng-select Cell Demo  
**Date**: February 11, 2026  
**Type**: Internal TypeScript Interface Contract

> **Note**: This is a frontend-only demo with no backend API. This document
> defines the TypeScript interface contracts between components and services.

## Service Contracts

### MockDataService

**Purpose**: Generate simulated grid data

**Interface**:

```typescript
interface MockDataService {
  /**
   * Generate an array of GridRow objects
   * @param rowCount - Number of rows to generate
   * @returns Array of GridRow objects with deterministic test data
   */
  generate(rowCount: number): GridRow[];
}
```

**Contract**:

- **Input**: `rowCount` must be positive integer (1-10000 reasonable range)
- **Output**: Array of exactly `rowCount` GridRow objects
- **Guarantee**: Each row has unique `id` field (1 to rowCount)
- **Guarantee**: All required fields populated (no null/undefined)
- **Guarantee**: `status` field will be one of valid StatusOption.label values

**Usage Example**:

```typescript
const service = inject(MockDataService);
const data = service.generate(100); // Returns 100 GridRow objects
```

---

## Component Contracts

### AgGridDemoComponent

**Purpose**: Main container component that manages grid configuration and data

**Public Interface**:

```typescript
@Component({
  selector: "app-ag-grid-demo",
  standalone: true,
})
export class AgGridDemoComponent implements OnInit {
  // No public inputs/outputs - standalone route component

  ngOnInit(): void;
}
```

**Internal State**:

```typescript
{
  rowData: GridRow[];           // Grid data (100 rows)
  columnDefs: ColDef[];         // ag-Grid column definitions
  defaultColDef: ColDef;        // Default column configuration
  gridOptions: GridOptions;     // ag-Grid options
}
```

**Responsibilities**:

- Initialize grid with 100 rows of data
- Configure 15 columns (including ng-select column)
- Set up cell renderer for status column
- Provide grid options (OnPush detection, virtual scrolling)

---

### NgSelectCellRendererComponent

**Purpose**: Custom cell renderer for ng-select dropdown

**Public Interface**:

```typescript
@Component({
  selector: "app-ng-select-cell-renderer",
  standalone: true,
})
export class NgSelectCellRendererComponent implements ICellRendererAngularComp {
  /**
   * ag-Grid lifecycle method - initialize with cell parameters
   * @param params - Cell renderer parameters from ag-Grid
   */
  agInit(params: ICellRendererParams): void;

  /**
   * ag-Grid lifecycle method - refresh cell value
   * @param params - Updated cell renderer parameters
   * @returns true if refresh successful, false to destroy and recreate
   */
  refresh(params: ICellRendererParams): boolean;
}
```

**Internal Properties**:

```typescript
{
  value: string;                          // Current cell value
  params: ICellRendererParams;            // ag-Grid parameters
  statusOptions: StatusOption[];          // Dropdown options
}
```

**Event Handlers**:

```typescript
{
  /**
   * Handle ng-select value change
   * @param newValue - Newly selected status value
   */
  onSelectionChange(newValue: string): void;
}
```

**Contract**:

- **Input**: `params.value` contains current status string
- **Output**: Calls `params.setValue(newValue)` on selection change
- **Guarantee**: Dropdown opens on single click
- **Guarantee**: Selection updates cell value immediately
- **Guarantee**: No memory leaks (proper cleanup in ngOnDestroy)

---

## Data Model Contracts

### GridRow Interface

```typescript
export interface GridRow {
  id: number; // Unique identifier (1-N)
  name: string; // Full name (3-50 chars)
  email: string; // Email format
  status: string; // One of StatusOption.label values
  department: string; // Department name
  location: string; // Office location
  role: string; // Job role
  startDate: string; // ISO date format (YYYY-MM-DD)
  salary: number; // Positive number
  performance: string; // Performance rating
  projects: number; // Non-negative integer
  hoursLogged: number; // Non-negative number
  certification: string; // Certification status
  experience: number; // Non-negative integer (years)
  team: string; // Team assignment
}
```

**Validation Rules**:

- All fields required (no optional fields)
- `id` must be unique across all rows
- `email` should match pattern:
  `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- `status` must be one of: "Active", "Pending", "Inactive", "Suspended",
  "Archived"
- Numeric fields must be non-negative

---

### StatusOption Interface

```typescript
export interface StatusOption {
  id: string; // Unique identifier (e.g., "active")
  label: string; // Display text (e.g., "Active")
}
```

**Static Values**:

```typescript
const STATUS_OPTIONS: StatusOption[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "inactive", label: "Inactive" },
  { id: "suspended", label: "Suspended" },
  { id: "archived", label: "Archived" },
];
```

---

## ag-Grid Integration Contracts

### Column Definition Contract

**Status Column Configuration**:

```typescript
{
  field: 'status',
  headerName: 'Status (ng-select)',
  width: 110,
  cellRenderer: NgSelectCellRendererComponent,
  sortable: true,
  filter: true,
  resizable: true,
}
```

**Default Column Configuration**:

```typescript
{
  width: 130,
  resizable: true,
  sortable: true,
  filter: true,
}
```

### Grid Options Contract

```typescript
{
  rowData: GridRow[],
  columnDefs: ColDef[],
  defaultColDef: ColDef,
  suppressRowHoverHighlight: false,
  animateRows: true,
  enableCellTextSelection: true,
}
```

---

## Component Communication Flow

```
1. User Action: Click status cell
   ↓
2. ng-select opens dropdown (appendTo="body")
   ↓
3. User selects new value
   ↓
4. NgSelectCellRendererComponent.onSelectionChange(newValue)
   ↓
5. params.setValue(newValue)
   ↓
6. ag-Grid updates GridRow.status in rowData
   ↓
7. Cell displays new value
```

---

## Error Handling

### MockDataService

**Errors**:

- `rowCount < 1`: Returns empty array
- `rowCount > 10000`: Logs warning, continues generation (performance
  consideration)

### NgSelectCellRendererComponent

**Errors**:

- Invalid params.value: Falls back to 'Active' default
- Missing statusOptions: Uses hardcoded STATUS_OPTIONS constant
- setValue() fails: Logs error to console, user sees visual update but grid
  state may be stale

---

## Performance Contracts

### MockDataService.generate()

- **Complexity**: O(n) where n = rowCount
- **Execution Time**: <100ms for 1000 rows
- **Memory**: ~15KB per 100 rows (approximate)

### NgSelectCellRendererComponent

- **Render Time**: <16ms per cell (60fps target)
- **Dropdown Open**: <100ms (as per spec SC-003)
- **Memory**: <5KB per instance (ag-Grid reuses instances)

---

## Testing Contracts

### Unit Test Coverage

**MockDataService**:

```typescript
describe("MockDataService", () => {
  it("should generate correct number of rows");
  it("should generate unique IDs");
  it("should populate all required fields");
  it("should use valid status values");
});
```

**NgSelectCellRendererComponent**:

```typescript
describe("NgSelectCellRendererComponent", () => {
  it("should implement ICellRendererAngularComp");
  it("should initialize with cell value");
  it("should update value on selection");
  it("should call params.setValue() on change");
});
```

**AgGridDemoComponent**:

```typescript
describe("AgGridDemoComponent", () => {
  it("should initialize with 100 rows");
  it("should have 15 column definitions");
  it("should configure status column with cell renderer");
});
```

---

## Summary

All contracts defined are:

- ✅ Type-safe (TypeScript strict mode)
- ✅ Testable (clear inputs/outputs)
- ✅ Documented (purpose and guarantees specified)
- ✅ Aligned with spec requirements (FR-001 through FR-010)
