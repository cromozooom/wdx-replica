# SPX Magic Selector - Quickstart Guide

**Date**: February 14, 2026  
**Feature**: [spec.md](spec.md)  
**Implementation Plan**: [plan.md](plan.md)

## Overview

The SPX Magic Selector is an advanced ng-select component with discovery modal
functionality for complex form/document selection scenarios. It provides a
streamlined dropdown interface with an optional full-screen modal for detailed
selection exploration.

## Quick Implementation

### 1. Basic Usage

```typescript
// app.component.ts
import { Component } from "@angular/core";
import { SpxMagicSelectorComponent } from "./spx-magic-selector/spx-magic-selector.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [SpxMagicSelectorComponent],
  template: `
    <div class="container">
      <h2>Select Form or Document</h2>
      <spx-magic-selector
        [domainId]="'crm-scheduling'"
        placeholder="Choose a form or document..."
        (selectionChange)="onSelectionChange($event)"
      >
      </spx-magic-selector>

      <!-- Selection preview will appear here automatically -->
    </div>
  `,
})
export class AppComponent {
  onSelectionChange(event: SelectionChangeEvent) {
    console.log("Selected:", event.selectedItem, event.selectedQuery);
  }
}
```

### 2. With Form Integration

```typescript
// form-integration.component.ts
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { SpxMagicSelectorComponent } from "./spx-magic-selector/spx-magic-selector.component";

@Component({
  selector: "app-form-integration",
  standalone: true,
  imports: [ReactiveFormsModule, SpxMagicSelectorComponent],
  template: `
    <form [formGroup]="formGroup" class="card">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Document Selection</label>
          <spx-magic-selector
            formControlName="selectedDocument"
            domainId="document-management"
            [disabled]="formGroup.get('selectedDocument')?.disabled"
          >
          </spx-magic-selector>
          <div
            class="form-text text-danger"
            *ngIf="formGroup.get('selectedDocument')?.errors?.['required']"
          >
            Document selection is required
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="formGroup.invalid"
        >
          Process Selection
        </button>
      </div>
    </form>
  `,
})
export class FormIntegrationComponent implements OnInit {
  formGroup!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.fb.group({
      selectedDocument: [
        null,
        [Validators.required, requiredSelectionValidator()],
      ],
    });
  }

  onSubmit() {
    if (this.formGroup.valid) {
      const selection = this.formGroup.get("selectedDocument")?.value;
      console.log("Processing:", selection);
    }
  }
}
```

## Configuration

### Domain Setup

```typescript
// domain-configuration.service.ts
import { Injectable } from "@angular/core";
import { DomainSchema, SelectionItem } from "./models";

@Injectable({ providedIn: "root" })
export class DomainConfigurationService {
  getCrmDomain(): DomainSchema {
    return {
      domainId: "crm-scheduling",
      name: "CRM & Scheduling",
      description: "Forms and documents for customer management",
      entities: [
        {
          name: "Contact",
          displayName: "Contact Records",
          fields: [
            { name: "id", type: "string", required: true },
            { name: "name", type: "string", required: true },
            { name: "email", type: "string", required: false },
          ],
          primaryKey: "id",
        },
      ],
      isActive: true,
    };
  }

  getDocumentDomain(): DomainSchema {
    return {
      domainId: "document-management",
      name: "Document Management",
      description: "Legal documents and contracts",
      entities: [
        {
          name: "LegalContract",
          displayName: "Legal Contracts",
          fields: [
            { name: "id", type: "string", required: true },
            { name: "title", type: "string", required: true },
            {
              name: "status",
              type: "enum",
              values: ["Draft", "Active", "Expired"],
            },
          ],
          primaryKey: "id",
        },
      ],
      isActive: true,
    };
  }
}
```

### Mock Data Setup

```typescript
// mock-data.service.ts
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { SelectionItem, Query } from "./models";

@Injectable({ providedIn: "root" })
export class MockDataService {
  private readonly mockItems: SelectionItem[] = [
    {
      id: "form-appointment",
      type: "Form",
      name: "Appointment Form",
      entityName: "Contact",
      queries: [
        {
          id: "query-all-contacts",
          name: "All Contacts",
          description: "Returns every active person in the database",
          parameters: {
            filters: [
              {
                field: "status",
                operator: "equals",
                value: "Active",
                isActive: true,
              },
            ],
          },
          estimatedCount: 2500,
          previewData: [
            {
              id: 1,
              displayData: { name: "John Doe", email: "john@example.com" },
            },
            {
              id: 2,
              displayData: { name: "Jane Smith", email: "jane@example.com" },
            },
          ],
        },
        {
          id: "query-recent-leads",
          name: "Recent Leads",
          description: "Contacts created in the last 30 days",
          parameters: {
            filters: [
              {
                field: "status",
                operator: "equals",
                value: "Active",
                isActive: true,
              },
            ],
            dateRange: {
              field: "createdDate",
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date(),
            },
          },
          estimatedCount: 150,
          previewData: [
            {
              id: 3,
              displayData: {
                name: "New Client A",
                email: "newclient@example.com",
              },
            },
          ],
        },
      ],
    },
  ];

  getAvailableItems(domainId: string): Observable<SelectionItem[]> {
    // Simulate API delay
    return of(this.mockItems).pipe(delay(500));
  }

  searchItems(
    searchTerm: string,
    domainId: string,
  ): Observable<SelectionItem[]> {
    const filtered = this.mockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.entityName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return of(filtered).pipe(delay(300));
  }
}
```

## Styling with Bootstrap

The component uses Bootstrap classes exclusively. No custom SCSS required:

```html
<!-- Component template example -->
<div class="spx-magic-selector">
  <!-- Main selector with Bootstrap styling -->
  <div class="input-group">
    <ng-select class="form-control" [class.is-invalid]="hasError">
      <!-- ng-select content -->
    </ng-select>
    <button
      class="btn btn-outline-secondary"
      type="button"
      (click)="openDiscoveryModal()"
      title="Advanced Search"
    >
      <i class="fas fa-search-plus"></i>
    </button>
  </div>

  <!-- Validation feedback -->
  <div class="invalid-feedback" *ngIf="hasError">{{ errorMessage }}</div>

  <!-- Preview container -->
  <div class="card mt-2" *ngIf="selectedItem">
    <div class="card-body py-2">
      <div class="row align-items-center">
        <div class="col-auto">
          <span class="badge bg-primary">{{ selectedItem.entityName }}</span>
        </div>
        <div class="col">
          <small class="text-muted">{{ selectedQuery?.description }}</small>
        </div>
        <div class="col-auto">
          <span class="badge bg-secondary">{{ estimatedCount }} records</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Testing

### Unit Test Example

```typescript
// spx-magic-selector.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SpxMagicSelectorComponent } from './spx-magic-selector.component';
import { SelectionDataService } from '../services/selection-data.service';

describe('SpxMagicSelectorComponent', () => {
  let component: SpxMagicSelectorComponent;
  let fixture: ComponentFixture<SpxMagicSelectorComponent>;
  let mockDataService: jasmine.SpyObj<SelectionDataService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SelectionDataService', ['getAvailableItems', 'searchItems']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NgSelectModule, SpxMagicSelectorComponent],
      providers: [
        { provide: SelectionDataService, useValue: spy }
      ]
    });

    fixture = TestBed.createComponent(SpxMagicSelectorComponent);
    component = fixture.componentInstance;
    mockDataService = TestBed.inject(SelectionDataService) as jasmine.SpyObj<SelectionDataService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load available items on init', () => {
    const mockItems = [/* mock data */];
    mockDataService.getAvailableItems.and.returnValue(of(mockItems));

    component.ngOnInit();

    expect(mockDataService.getAvailableItems).toHaveBeenCalledWith(component.domainId);
    expect(component.availableItems).toEqual(mockItems);
  });

  it('should emit selection change event', () => {
    spyOn(component.selectionChange, 'emit');
    const mockSelection = /* mock selection item */;

    component.onSelectionChange(mockSelection);

    expect(component.selectionChange.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      selectedItem: mockSelection,
      source: 'dropdown'
    }));
  });
});
```

### Integration Test Example

```typescript
// spx-magic-selector.integration.spec.ts
describe("SpxMagicSelector Integration", () => {
  it("should complete full selection workflow", async () => {
    // 1. Render component
    const fixture = TestBed.createComponent(TestHostComponent);
    const compiled = fixture.nativeElement;

    // 2. Click dropdown to open
    const dropdown = compiled.querySelector(".ng-select");
    dropdown.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // 3. Select an option
    const option = compiled.querySelector(".ng-option");
    option.click();
    fixture.detectChanges();

    // 4. Verify preview container appears
    const preview = compiled.querySelector(".preview-container");
    expect(preview).toBeTruthy();

    // 5. Verify selection event was emitted
    expect(hostComponent.selectionEvent).toBeDefined();
    expect(hostComponent.selectionEvent.selectedItem).toBeTruthy();
  });
});
```

## Performance Considerations

### Lazy Loading

- Discovery modal component loads only when needed
- Preview data fetched on-demand during inspection
- Virtual scrolling enabled for >100 grid rows

### Memory Management

```typescript
// Component lifecycle management
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Subscription management pattern
this.dataService.getItems()
  .pipe(takeUntil(this.destroy$))
  .subscribe(items => {
    // Handle items
  });
```

### Bundle Size

- No additional dependencies required
- Tree-shaking enabled for all imports
- Lazy-loaded modal keeps initial bundle small

## Next Steps

1. Review [data-model.md](data-model.md) for entity relationships
2. Check [contracts/component-interfaces.md](contracts/component-interfaces.md)
   for TypeScript interfaces
3. Run `/speckit.tasks` to break down implementation tasks
4. Begin development with P1 user story (Basic Selector Interaction)

This quickstart provides everything needed to begin implementing the SPX Magic
Selector component following the project's constitutional requirements and
architectural patterns.
