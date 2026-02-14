import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SpxMagicSelectorComponent } from "./components/spx-magic-selector.component";
import { SelectionChangeEvent } from "./models/selection-change-event.interface";

/**
 * Demo page for testing SPX Magic Selector component
 */
@Component({
  selector: "app-spx-magic-selector-demo",
  standalone: true,
  imports: [CommonModule, FormsModule, SpxMagicSelectorComponent],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-3">SPX Magic Selector Demo</h1>
          <p class="lead text-muted">
            Advanced lookup component with ng-select dropdown and ag-grid
            discovery modal
          </p>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">SPX Magic Selector</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Domain</label>
                <select
                  class="form-select"
                  [(ngModel)]="selectedDomain"
                  (ngModelChange)="onDomainChange()"
                >
                  <option value="crm-scheduling">CRM & Scheduling</option>
                  <option value="document-management">
                    Document Management
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Select Form or Document</label>
                <app-spx-magic-selector
                  [domainId]="selectedDomain"
                  [placeholder]="'Choose a form or document...'"
                  (selectionChange)="onSelectionChange($event)"
                ></app-spx-magic-selector>
              </div>

              <div class="alert alert-info" role="alert">
                <strong>Try it out:</strong>
                <ul class="mb-0 mt-2">
                  <li>Search in the dropdown</li>
                  <li>Click "Advanced" for full grid view</li>
                  <li>View preview details after selection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h5 class="mb-0">Selection Events</h5>
            </div>
            <div class="card-body">
              <div *ngIf="lastEvent; else noSelection">
                <h6 class="text-muted">Last Selection Event:</h6>
                <pre
                  class="bg-light p-3 rounded"
                ><code>{{ formatEvent(lastEvent) }}</code></pre>
              </div>
              <ng-template #noSelection>
                <p class="text-muted">Make a selection to see event details</p>
              </ng-template>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">Features</h5>
            </div>
            <div class="card-body">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <strong>User Story 1:</strong> Searchable dropdown selection
                </li>
                <li class="mb-2">
                  <strong>User Story 2:</strong> Live preview with record counts
                </li>
                <li class="mb-2">
                  <strong>User Story 3:</strong> Advanced ag-grid discovery
                  modal
                </li>
                <li class="mb-2">
                  <strong>User Story 4:</strong> Inspector panel (future
                  enhancement)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      pre {
        max-height: 400px;
        overflow-y: auto;
      }
    `,
  ],
})
export class SpxMagicSelectorDemoComponent {
  selectedDomain = "crm-scheduling";
  lastEvent: SelectionChangeEvent | null = null;

  onDomainChange(): void {
    // Domain changed - component will re-initialize with new domain
  }

  onSelectionChange(event: SelectionChangeEvent): void {
    this.lastEvent = event;
  }

  formatEvent(event: SelectionChangeEvent): string {
    return JSON.stringify(
      {
        selectedItem: event.selectedItem?.name || null,
        selectedQuery: event.selectedQuery?.name || null,
        source: event.source,
        timestamp: event.timestamp,
      },
      null,
      2,
    );
  }
}
