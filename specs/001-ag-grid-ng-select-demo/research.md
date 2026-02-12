# Research: ag-Grid with ng-select Cell Demo

**Feature**: ag-Grid with ng-select Cell Demo  
**Date**: February 11, 2026  
**Phase**: Phase 0 - Research & Design Decisions

## Research Tasks

### 1. ng-select Integration with ag-Grid

**Decision**: Use Custom Cell Renderer approach

**Rationale**:

- ag-Grid provides ICellRendererAngularComp interface for Angular component
  integration
- ng-select is already installed (@ng-select/ng-select 14.9.0)
- Cell renderer pattern allows full Angular component lifecycle within cells
- Recommended approach per ag-grid official documentation for complex cell UI

**Alternatives Considered**:

- **Cell Editor**: Requires entering edit mode (double-click). Rejected because
  spec requires immediate interaction (single-click to open dropdown)
- **Custom HTML in cellRenderer function**: Would lose Angular component
  features and data binding. Rejected.
- **Third-party ag-grid ng-select plugin**: None exist that are actively
  maintained. Rejected.

**Implementation Details**:

- Create standalone Angular component implementing ICellRendererAngularComp
- Component receives cell value via agInit(params: ICellRendererParams)
- Updates cell value via params.setValue() when selection changes
- ng-select configured with appendTo='body' to avoid clipping within cell
  boundaries

---

### 2. Data Generation Strategy

**Decision**: Use faker.js-compatible approach with native TypeScript

**Rationale**:

- No new dependencies (constitutional requirement: minimal dependencies)
- Simple data structure: 15 columns × 100 rows
- Realistic but deterministic test data needed for reproducible testing
- Performance: Generate once on component init, store in memory

**Alternatives Considered**:

- **Faker.js library**: Adds ~1.2MB dependency. Rejected (constitution
  violation).
- **Real API call**: Out of scope per spec. Rejected.
- **Static JSON file**: Less flexible, harder to customize column count.
  Rejected.

**Implementation Details**:

```typescript
// Pseudo-code structure
interface GridRow {
  id: number;
  name: string;
  email: string;
  status: string; // ng-select column
  column1: string;
  // ... up to 15 total columns
}

// Function to generate deterministic test data
function generateMockData(rowCount: number): GridRow[] {
  const statuses = ["Active", "Pending", "Inactive", "Suspended", "Archived"];
  const firstNames = ["John", "Jane", "Bob", "Alice", "Charlie"];
  const lastNames = ["Smith", "Doe", "Johnson", "Williams", "Brown"];

  return Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % 5]} ${lastNames[i % 5]}`,
    email: `user${i}@example.com`,
    status: statuses[i % 5],
    column1: `Data ${i}-1`,
    // ... etc
  }));
}
```

---

### 3. Routing Integration

**Decision**: Add lazy-loaded route '/ag-grid-demo'

**Rationale**:

- Follows existing project pattern (configuration-manager, garden-room are
  lazy-loaded)
- Keeps demo isolated from main bundle
- Consistent with constitution principle IV (Performance First - lazy loading)

**Implementation Pattern**:

```typescript
// In app.routes.ts
{
  path: 'ag-grid-demo',
  loadChildren: () =>
    import('./ag-grid-demo/ag-grid-demo.routes').then(
      (m) => m.agGridDemoRoutes
    ),
}
```

**Structure**:

```
src/app/ag-grid-demo/
├── ag-grid-demo.component.ts       # Main grid component
├── ag-grid-demo.component.html     # Grid template
├── ag-grid-demo.component.scss     # Minimal styling
├── ag-grid-demo.routes.ts          # Route configuration
├── components/
│   └── ng-select-cell-renderer/
│       ├── ng-select-cell-renderer.component.ts
│       ├── ng-select-cell-renderer.component.html
│       └── ng-select-cell-renderer.component.scss
├── services/
│   └── mock-data.service.ts        # Data generation
└── models/
    └── grid-row.interface.ts       # Type definition
```

---

### 4. Column Configuration for Constrained Space

**Decision**: Use fixed column widths with horizontal scrolling

**Rationale**:

- Spec requirement: "plenty of columns so ng-select has small space"
- ag-Grid default column width is 200px; reduce to 120-150px for constraint
- Enable horizontal scrolling to accommodate 15 columns
- ng-select column specifically set to narrower width (100-120px) to test
  constraint behavior

**Configuration**:

```typescript
defaultColDef: {
  width: 130,
  resizable: true,
  sortable: true,
  filter: true,
}

// ng-select column specific
{
  field: 'status',
  headerName: 'Status (ng-select)',
  width: 110, // Constrained space
  cellRenderer: NgSelectCellRendererComponent,
}
```

---

### 5. ng-select Dropdown Positioning

**Decision**: Use appendTo='body' with auto-positioning

**Rationale**:

- Prevents clipping when cell is near viewport edges
- ng-select's Popper.js integration handles auto-positioning
- Addresses edge case: "What happens when ng-select cell is at edge of
  viewport?"

**Configuration**:

```typescript
// In ng-select-cell-renderer component template
<ng-select
  [items]="items"
  [(ngModel)]="value"
  appendTo="body"
  [clearable]="false"
  (change)="onSelectionChange($event)">
</ng-select>
```

---

### 6. State Management Approach

**Decision**: Component-local state (no @ngrx/signals or @ngrx/store)

**Rationale**:

- Demo component with no cross-component state sharing needs
- Constitution: "Use signals (@ngrx/signals) for state management **where
  appropriate**"
- Simpler approach: row data in component property, updates via ag-Grid API
- Avoids complexity for isolated demo feature

**State Structure**:

```typescript
export class AgGridDemoComponent {
  rowData: GridRow[] = [];

  ngOnInit() {
    this.rowData = this.mockDataService.generate(100);
  }

  // ag-Grid handles its own internal state
  // Cell renderer updates values directly via params.setValue()
}
```

---

### 7. Testing Strategy

**Decision**: Component unit tests + manual interaction testing

**Rationale**:

- Karma + Jasmine already configured
- Test data generation service
- Test component initialization
- Manual testing required for dropdown interaction (visual/UX validation)

**Test Coverage**:

- ✅ Unit: MockDataService generates correct structure (15 columns, 100 rows)
- ✅ Unit: Component initializes with row data
- ✅ Unit: Column definitions include ng-select renderer
- 🧪 Manual: Dropdown opens/closes correctly
- 🧪 Manual: Selection persists after scrolling
- 🧪 Manual: Dropdown positioning at viewport edges

---

## Summary of Decisions

| Aspect               | Decision                       | Key Benefit                    |
| -------------------- | ------------------------------ | ------------------------------ |
| Cell Integration     | Custom Cell Renderer           | Full Angular component support |
| Data Generation      | Native TypeScript              | Zero dependencies              |
| Routing              | Lazy-loaded '/ag-grid-demo'    | Performance isolation          |
| Column Widths        | Fixed 110-130px with scrolling | Creates constrained space      |
| Dropdown Positioning | appendTo='body'                | Prevents clipping              |
| State Management     | Component-local                | Simplicity for demo            |
| Testing              | Unit + manual                  | Practical coverage             |

All decisions align with project constitution (minimal dependencies, clean code,
performance first).
