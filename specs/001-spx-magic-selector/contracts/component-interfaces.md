# SPX Magic Selector Component Interfaces

**Date**: February 14, 2026  
**Feature**: [../spec.md](../spec.md)  
**Data Model**: [../data-model.md](../data-model.md)

## Component Interface Contracts

### SpxMagicSelectorComponent (Smart Component)

```typescript
interface SpxMagicSelectorComponent {
  // Input Properties
  initialSelection?: SelectionItem;
  domainId?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;

  // Output Events
  selectionChange: EventEmitter<SelectionChangeEvent>;
  domainSwitch: EventEmitter<DomainSwitchEvent>;
  validationError: EventEmitter<ValidationErrorEvent>;

  // Public Methods
  clearSelection(): void;
  refreshData(): void;
  setDomain(domainId: string): void;

  // Form Integration
  value: any; // ControlValueAccessor compliance
  disabled: boolean;
  onTouched: () => void;
  onChange: (value: any) => void;
}

interface SelectionChangeEvent {
  selectedItem: SelectionItem | null;
  selectedQuery: Query | null;
  previousSelection?: SelectionItem;
  timestamp: Date;
  source: "dropdown" | "modal" | "api";
}

interface DomainSwitchEvent {
  fromDomain: string;
  toDomain: string;
  timestamp: Date;
}

interface ValidationErrorEvent {
  error: ValidationError;
  field: string;
  value: any;
  timestamp: Date;
}
```

### PreviewContainerComponent (Dumb Component)

```typescript
interface PreviewContainerComponent {
  // Input Properties
  selectedItem: SelectionItem | null;
  selectedQuery: Query | null;
  loading: boolean;
  error?: string;
  showRecordCount: boolean;

  // Output Events
  refreshRequest: EventEmitter<RefreshRequestEvent>;
  detailsRequest: EventEmitter<DetailsRequestEvent>;

  // Public Methods
  refreshPreview(): void;
}

interface RefreshRequestEvent {
  itemId: string;
  queryId: string;
  timestamp: Date;
}

interface DetailsRequestEvent {
  itemId: string;
  queryId: string;
  requestedDetails: string[];
}
```

### DiscoveryModalComponent (Smart Component)

```typescript
interface DiscoveryModalComponent {
  // Input Properties
  availableItems: SelectionItem[];
  currentSelection?: SelectionItem;
  domainSchema: DomainSchema;
  modalTitle?: string;
  showInspector: boolean;

  // Output Events
  selectionConfirmed: EventEmitter<ModalSelectionEvent>;
  selectionCancelled: EventEmitter<void>;
  inspectionRequest: EventEmitter<InspectionRequestEvent>;

  // Public Methods
  openModal(): void;
  closeModal(): void;
  resetSelection(): void;

  // Grid Interaction
  onRowSelected(row: FlatSelectionRow): void;
  onRowDoubleClick(row: FlatSelectionRow): void;
}

interface ModalSelectionEvent {
  selectedRow: FlatSelectionRow;
  selectionItem: SelectionItem;
  selectedQuery: Query;
  confirmed: boolean;
  timestamp: Date;
}

interface InspectionRequestEvent {
  row: FlatSelectionRow;
  previewRequested: boolean;
  timestamp: Date;
}
```

### InspectorPanelComponent (Dumb Component)

```typescript
interface InspectorPanelComponent {
  // Input Properties
  inspectedRow: FlatSelectionRow | null;
  previewData: PreviewRecord[];
  queryParameters: QueryParameters | null;
  loading: boolean;
  error?: string;

  // Output Events
  previewRefresh: EventEmitter<PreviewRefreshEvent>;
  parameterChange: EventEmitter<ParameterChangeEvent>;

  // Public Methods
  refreshPreview(): void;
  clearInspection(): void;
}

interface PreviewRefreshEvent {
  queryId: string;
  refreshType: "manual" | "automatic";
  timestamp: Date;
}

interface ParameterChangeEvent {
  parameter: string;
  oldValue: any;
  newValue: any;
  queryId: string;
}
```

## Service Interface Contracts

### SelectionDataService

```typescript
interface SelectionDataService {
  // Data Retrieval
  getAvailableItems(domainId: string): Observable<SelectionItem[]>;
  getDomainSchemas(): Observable<DomainSchema[]>;
  getItemById(itemId: string): Observable<SelectionItem | null>;
  getQueryById(itemId: string, queryId: string): Observable<Query | null>;

  // Search & Filtering
  searchItems(criteria: SearchCriteria): Observable<SearchResult>;
  filterByEntity(entityName: string): Observable<SelectionItem[]>;

  // Data Validation
  validateSelection(
    item: SelectionItem,
    query: Query,
  ): Observable<ValidationResult>;
  estimateRecordCount(query: Query): Observable<number>;
}

interface SearchCriteria {
  term: string;
  domainId?: string;
  entityFilter?: string;
  includeMetadata: boolean;
  maxResults?: number;
}

interface SearchResult {
  items: SelectionItem[];
  totalCount: number;
  searchTerm: string;
  executionTime: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations?: string[];
}
```

### QueryExecutorService

```typescript
interface QueryExecutorService {
  // Query Execution
  executeQuery(query: Query): Observable<QueryExecutionResult>;
  getPreviewData(query: Query): Observable<PreviewRecord[]>;
  getRecordCount(query: Query): Observable<number>;

  // Query Analysis
  analyzeQuery(query: Query): Observable<QueryAnalysis>;
  validateQueryParameters(
    parameters: QueryParameters,
  ): Observable<ParameterValidation>;

  // Performance Monitoring
  getExecutionStats(queryId: string): Observable<ExecutionStats>;
}

interface QueryExecutionResult {
  success: boolean;
  records: any[];
  totalCount: number;
  executionTime: number;
  query: Query;
  metadata: ExecutionMetadata;
}

interface QueryAnalysis {
  estimatedComplexity: "low" | "medium" | "high";
  estimatedDuration: number;
  indexUtilization: IndexInfo[];
  recommendations: string[];
}

interface ExecutionStats {
  averageTime: number;
  callCount: number;
  errorRate: number;
  lastExecuted: Date;
}
```

### DomainSwitcherService

```typescript
interface DomainSwitcherService {
  // Domain Management
  getCurrentDomain(): Observable<DomainSchema>;
  getAvailableDomains(): Observable<DomainSchema[]>;
  switchDomain(domainId: string): Observable<DomainSwitchResult>;

  // Domain Configuration
  validateDomainSwitch(targetDomainId: string): Observable<SwitchValidation>;
  migrateSelection(
    fromDomain: string,
    toDomain: string,
    selection: SelectionItem,
  ): Observable<MigrationResult>;
}

interface DomainSwitchResult {
  success: boolean;
  newDomain: DomainSchema;
  migratedSelection?: SelectionItem;
  warnings: string[];
}

interface SwitchValidation {
  canSwitch: boolean;
  migrationRequired: boolean;
  compatibilityIssues: string[];
  dataLossWarnings: string[];
}

interface MigrationResult {
  success: boolean;
  migratedSelection: SelectionItem | null;
  lostData: string[];
  warnings: string[];
}
```

## ag-grid Integration Contracts

### Grid Configuration Interface

```typescript
interface SpxGridConfig {
  columnDefs: ColDef[];
  rowData: FlatSelectionRow[];
  selectionMode: "single" | "multiple";
  enableFiltering: boolean;
  enableSorting: boolean;
  virtualScrolling: boolean;

  // Event Handlers
  onSelectionChanged: (event: SelectionChangedEvent) => void;
  onRowClicked: (event: RowClickedEvent) => void;
  onRowDoubleClicked: (event: RowDoubleClickedEvent) => void;
  onGridReady: (event: GridReadyEvent) => void;
}

interface GridColumn {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  resizable: boolean;
  sortable: boolean;
  filter: boolean;
  cellRenderer?: string;
  cellRendererParams?: any;
}
```

## Form Integration Contracts

### Angular Reactive Forms

```typescript
interface SpxFormControl extends AbstractControl {
  value: SelectionItem | null;

  // Validation
  validators: ValidatorFn[];
  errors: ValidationErrors | null;

  // Custom Validators
  requiredSelection: ValidatorFn;
  validDomainSelection: ValidatorFn;
  queryCompatibility: ValidatorFn;
}

// Custom Form Validator Functions
function requiredSelectionValidator(): ValidatorFn;
function domainCompatibilityValidator(allowedDomains: string[]): ValidatorFn;
function queryValidationValidator(): ValidatorFn;
```

## Error Handling Contracts

```typescript
interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: "error" | "warning" | "info";
  details?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  error: ValidationError;
  timestamp: Date;
  requestId: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: Date;
  requestId: string;
}

type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
```

These interface contracts provide type-safe communication between all components
and services while maintaining clear separation of concerns and enabling
independent testing of each component.
