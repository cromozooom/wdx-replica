# Quick Start Guide: Configuration Manager

**Feature**: Configuration Manager  
**For**: Developers implementing or contributing to this feature  
**Last Updated**: 2026-02-02

## Prerequisites

- Node.js 18+ and npm installed
- Angular CLI 19.2+ installed globally
- VS Code (recommended) with Angular Language Service extension
- Basic familiarity with Angular 19, TypeScript, and RxJS

## Quick Setup (5 minutes)

1. **Clone and install**:

   ```bash
   git checkout 001-config-manager
   npm install
   ```

2. **Run development server**:

   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200/configuration-manager`

3. **Verify dependencies** (all should already be installed):
   ```bash
   npm list ag-grid-angular jsoneditor ace-builds jszip @ng-bootstrap/ng-bootstrap
   ```

## Project Structure Overview

```
src/app/configuration-manager/
├── configuration-manager.component.ts       # Main container (smart)
├── components/                              # UI components
│   ├── configuration-grid/                 # AG-Grid wrapper (dumb)
│   ├── configuration-editor/               # Editor orchestrator (smart)
│   ├── json-editor/                        # JSONEditor wrapper (dumb)
│   ├── ace-editor/                         # Ace wrapper (dumb)
│   ├── configuration-metadata-form/        # Metadata form (dumb)
│   ├── update-history/                     # Update history list (dumb)
│   ├── import-wizard/                      # Import wizard (smart)
│   └── conflict-comparison/                # Diff view (dumb)
├── models/                                  # TypeScript interfaces
│   ├── configuration.model.ts              # Main entity
│   ├── configuration-type.enum.ts          # Type enum
│   ├── update-entry.model.ts               # Update history
│   └── export-package.model.ts             # ZIP structure
├── services/                                # Business logic
│   ├── configuration.service.ts            # CRUD operations
│   ├── configuration-storage.service.ts    # IndexedDB
│   ├── configuration-export.service.ts     # Export to ZIP
│   ├── configuration-import.service.ts     # Import from ZIP
│   ├── configuration-validator.service.ts  # Validation logic
│   └── team-member.service.ts              # Team member list
├── store/                                   # State management
│   ├── configuration.store.ts              # @ngrx/signals store
│   └── import-wizard.store.ts              # Import wizard state
└── utils/                                   # Utility functions
    ├── version-validator.ts                # V#.#.# validation
    ├── jira-validator.ts                   # WPO-##### validation
    └── semantic-version-comparator.ts      # Version sorting
```

## Key Concepts

### Smart vs Dumb Components

**Smart Components** (3 total):

- Handle data fetching and state management
- Use dependency injection for services
- Manage component lifecycle and subscriptions
- Examples: ConfigurationManagerComponent, ConfigurationEditorComponent

**Dumb Components** (6 total):

- Receive data via `@Input()`
- Emit events via `@Output()`
- No direct service dependencies
- Examples: ConfigurationGridComponent, JsonEditorComponent

### State Management

Using `@ngrx/signals` for reactive state:

```typescript
// In component
readonly store = inject(ConfigurationStore);

// Read state
configurations = this.store.filteredConfigurations;
loading = this.store.loading;

// Update state
this.store.setSearchTerm('dashboard');
this.store.save(configuration);
```

### Service Pattern

All services are injectable singletons:

```typescript
@Injectable({ providedIn: "root" })
export class ConfigurationService {
  private readonly storage = inject(ConfigurationStorageService);

  getAll(): Observable<Configuration[]> {
    return this.storage.getAll();
  }

  save(config: Configuration): Observable<Configuration> {
    // Validation, ID generation, timestamp updates
    return this.storage.save(config);
  }
}
```

## Common Development Tasks

### Adding a New Configuration Type

1. **Update enum** in `configuration-type.enum.ts`:

   ```typescript
   enum ConfigurationType {
     // ...existing types
     NEW_TYPE = "New Type (JSON)",
   }
   ```

2. **Update helper functions**:

   ```typescript
   function isJsonType(type: ConfigurationType): boolean {
     return [
       // ...existing types
       ConfigurationType.NEW_TYPE,
     ].includes(type);
   }
   ```

3. **Add default template** in
   `src/assets/configuration-templates/new-type.json`

### Creating a Configuration Programmatically

```typescript
const newConfig: Partial<Configuration> = {
  name: "My Dashboard",
  type: ConfigurationType.DASHBOARD_CONFIG,
  version: "V1.0.0",
  value: JSON.stringify({ layout: "grid" }, null, 2),
  updates: [],
};

this.store.save(newConfig as Configuration);
```

### Testing Configuration Validation

```typescript
it("should validate JSON configuration", () => {
  const validator = TestBed.inject(ConfigurationValidatorService);
  const config: Configuration = {
    type: ConfigurationType.DASHBOARD_CONFIG,
    value: '{"valid": "json"}',
    // ...other fields
  };

  expect(validator.validate(config)).toEqual({ valid: true });
});
```

### Working with IndexedDB

```typescript
// Service handles all IndexedDB complexity
const storageService = inject(ConfigurationStorageService);

// Save
storageService.save(configuration).subscribe((saved) => {
  console.log("Saved:", saved.id);
});

// Query by type
storageService
  .getByType(ConfigurationType.DASHBOARD_CONFIG)
  .subscribe((configs) => {
    console.log("Found:", configs.length);
  });

// Delete
storageService.delete(123).subscribe(() => {
  console.log("Deleted");
});
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- --include='**/configuration.service.spec.ts'

# With coverage
npm test -- --code-coverage
```

### Test Structure

```typescript
describe("ConfigurationService", () => {
  let service: ConfigurationService;
  let storage: jasmine.SpyObj<ConfigurationStorageService>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj("ConfigurationStorageService", [
      "getAll",
      "save",
      "delete",
    ]);

    TestBed.configureTestingModule({
      providers: [
        ConfigurationService,
        { provide: ConfigurationStorageService, useValue: storageSpy },
      ],
    });

    service = TestBed.inject(ConfigurationService);
    storage = TestBed.inject(
      ConfigurationStorageService,
    ) as jasmine.SpyObj<ConfigurationStorageService>;
  });

  it("should create configuration with auto-generated ID", () => {
    // Test implementation
  });
});
```

## Debugging Tips

### Chrome DevTools for IndexedDB

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB → ConfigurationManagerDB
4. Inspect `configurations` object store

### AG-Grid Debug Mode

```typescript
// In ConfigurationGridComponent
gridOptions: GridOptions = {
  debug: true, // Enable console logging
  // ...other options
};
```

### JSON Editor Error Handling

```typescript
onValidate(json: any): ValidationError[] {
  console.log('Validating:', json);
  // Custom validation logic
  return errors;
}
```

## Performance Optimization

### Lazy Loading Editors

```typescript
// Lazy load JSONEditor only when needed
private loadEditor(): Promise<typeof import('jsoneditor')> {
  return import('jsoneditor');
}

ngAfterViewInit() {
  this.loadEditor().then(module => {
    this.editor = new module.default(container, options);
  });
}
```

### Virtual Scrolling in AG-Grid

AG-Grid Enterprise handles virtual scrolling automatically. For 100+
configurations:

```typescript
gridOptions: GridOptions = {
  rowBuffer: 10, // Rows to render outside viewport
  suppressColumnVirtualisation: false,
};
```

### Memory Management

```typescript
// Use takeUntilDestroyed for auto-cleanup
private readonly destroyRef = inject(DestroyRef);

ngOnInit() {
  this.store.configurations$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(configs => {
      // Handle configurations
    });
}

// Dispose heavy resources
ngOnDestroy() {
  this.jsonEditor?.destroy();
  this.aceEditor?.destroy();
}
```

## Common Issues & Solutions

### Issue: "JSONEditor is not defined"

**Solution**: Ensure lazy loading is complete before accessing editor:

```typescript
async ngAfterViewInit() {
  const module = await import('jsoneditor');
  this.editor = new module.default(container, options);
}
```

### Issue: AG-Grid not displaying data

**Solution**: Check column definitions and row data binding:

```typescript
<ag-grid-angular
  [rowData]="configurations()"
  [columnDefs]="columnDefs"
  [getRowId]="getRowId"  // Important for stable row identity
></ag-grid-angular>

getRowId = (params: GetRowIdParams) => params.data.id.toString();
```

### Issue: IndexedDB quota exceeded

**Solution**: Implement cleanup or compression:

```typescript
// Check available storage
navigator.storage.estimate().then((estimate) => {
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
});

// Delete old configurations if needed
```

### Issue: ZIP import fails silently

**Solution**: Add error handling to import service:

```typescript
import(file: File): Observable<ImportResult> {
  return from(JSZip.loadAsync(file)).pipe(
    catchError(error => {
      console.error('ZIP load failed:', error);
      return throwError(() => new Error('Invalid ZIP file'));
    }),
    // ...rest of import logic
  );
}
```

## Code Style Compliance

### ESLint Checks

```bash
# Run linter
npm run lint

# Auto-fix where possible
npm run lint -- --fix
```

### Constitutional Requirements

- ✅ Max 30 lines per function
- ✅ Max 300 lines per component
- ✅ No `any` types (use `unknown` and type guards)
- ✅ OnPush change detection on all components
- ✅ Standalone components (no NgModules)

### Example Component Template

```typescript
@Component({
  selector: "app-configuration-grid",
  standalone: true,
  imports: [AgGridAngular, CommonModule],
  templateUrl: "./configuration-grid.component.html",
  styleUrl: "./configuration-grid.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationGridComponent {
  @Input({ required: true }) configurations!: Configuration[];
  @Output() selectionChanged = new EventEmitter<number[]>();

  // Component logic (max 300 lines total)
}
```

## Next Steps

1. **Read** [data-model.md](data-model.md) for entity definitions
2. **Review** [research.md](research.md) for technology decisions
3. **Check** [plan.md](plan.md) for overall architecture
4. **Run** `/speckit.tasks` to generate implementation tasks
5. **Start** with Phase 1 tasks (setup and foundational work)

## Useful Commands

```bash
# Start dev server
npm start

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build

# Analyze bundle size
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

## Getting Help

- **Spec docs**: `specs/001-config-manager/`
- **Constitution**: `.specify/memory/constitution.md`
- **Templates**: `.specify/templates/`
- **Project README**: `README.md`

## Contributing

All changes must:

1. Pass ESLint with zero warnings
2. Include unit tests
3. Follow constitutional principles
4. Not add new dependencies (use existing only)
5. Update this guide if adding new patterns

---

**Happy coding!** 🚀
