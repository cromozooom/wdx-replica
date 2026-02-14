import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  forwardRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { MatDialog } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { BehaviorSubject, Subject, Observable } from "rxjs";
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from "rxjs/operators";
import { SelectionItem } from "../models/selection-item.interface";
import { Query } from "../models/query.interface";
import { SelectionChangeEvent } from "../models/selection-change-event.interface";
import { SelectionDataService } from "../services/selection-data.service";
import { PreviewContainerComponent } from "./preview-container/preview-container.component";
import {
  DiscoveryModalComponent,
  DiscoveryModalDialogData,
  DiscoveryModalResult,
} from "./discovery-modal/discovery-modal.component";
import { DomainSchema } from "../models/domain-schema.interface";

/**
 * SPX Magic Selector - Smart component providing searchable dropdown for form/document selection
 * Implements ControlValueAccessor for Angular Forms integration
 */
@Component({
  selector: "app-spx-magic-selector",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    MatButtonModule,
    MatIconModule,
    PreviewContainerComponent,
  ],
  templateUrl: "./spx-magic-selector.component.html",
  styleUrls: ["./spx-magic-selector.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpxMagicSelectorComponent),
      multi: true,
    },
  ],
})
export class SpxMagicSelectorComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  // ========================================
  // Input Properties
  // ========================================

  /** Initial selection to display */
  @Input() initialSelection?: SelectionItem;

  /** Domain identifier for filtering items */
  @Input() domainId = "crm-scheduling";

  /** Placeholder text for the dropdown */
  @Input() placeholder = "Select a form or document";

  /** Whether the component is disabled */
  @Input() disabled = false;

  /** Whether the component is readonly */
  @Input() readonly = false;

  // ========================================
  // Output Events
  // ========================================

  /** Emits when selection changes */
  @Output() selectionChange = new EventEmitter<SelectionChangeEvent>();

  // ========================================
  // Component State
  // ========================================

  /** Available items for selection */
  availableItems$ = new BehaviorSubject<SelectionItem[]>([]);

  /** Currently selected item */
  selectedItem$ = new BehaviorSubject<SelectionItem | null>(null);

  /** Currently selected query (default to first query of selected item) */
  selectedQuery$ = new BehaviorSubject<Query | null>(null);

  /** Getter for selectedItem to support ngModel two-way binding */
  get selectedItem(): SelectionItem | null {
    return this.selectedItem$.value;
  }

  /** Setter for selectedItem to support ngModel two-way binding */
  set selectedItem(value: SelectionItem | null) {
    this.selectedItem$.next(value);
  }

  /** Search term subject for debounced filtering */
  private searchTerm$ = new Subject<string>();

  /** Destroy subject for cleanup */
  private destroy$ = new Subject<void>();

  /** ControlValueAccessor change callback */
  private onChange: (value: any) => void = () => {};

  /** ControlValueAccessor touched callback */
  private onTouched: () => void = () => {};

  // ========================================
  // Constructor
  // ========================================

  constructor(
    private selectionDataService: SelectionDataService,
    private dialog: MatDialog,
  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnInit(): void {
    this.loadAvailableItems();
    this.setupSearchDebounce();

    // Set initial selection if provided
    if (this.initialSelection) {
      this.setSelection(
        this.initialSelection,
        this.initialSelection.queries[0],
        "api",
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // ControlValueAccessor Implementation
  // ========================================

  writeValue(value: any): void {
    if (value) {
      // Value should be SelectionItem or item ID
      if (typeof value === "string") {
        this.selectionDataService
          .getItemById(value)
          .pipe(takeUntil(this.destroy$))
          .subscribe((item) => {
            if (item) {
              this.setSelection(item, item.queries[0], "api");
            }
          });
      } else if (value && typeof value === "object" && "id" in value) {
        this.setSelection(value, value.queries[0], "api");
      }
    } else {
      this.clearSelection();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    const previousItem = this.selectedItem$.value;

    this.selectedItem$.next(null);
    this.selectedQuery$.next(null);

    // Notify form control
    this.onChange(null);

    // Emit selection change event
    this.selectionChange.emit({
      selectedItem: null,
      selectedQuery: null,
      previousSelection: previousItem || undefined,
      timestamp: new Date(),
      source: "dropdown",
    });
  }

  /**
   * Refresh available items from the service
   */
  refreshData(): void {
    this.loadAvailableItems();
  }

  /**
   * Set the domain for filtering items
   */
  setDomain(domainId: string): void {
    this.domainId = domainId;
    this.loadAvailableItems();
  }

  /**
   * Handle selection change from ng-select
   */
  onSelectionChange(item: SelectionItem | null): void {
    if (item) {
      // Default to first query
      const defaultQuery = item.queries[0];
      this.setSelection(item, defaultQuery, "dropdown");
    } else {
      this.clearSelection();
    }

    // Mark as touched for form validation
    this.onTouched();
  }

  /**
   * Handle search input change
   */
  onSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  /**
   * Open advanced discovery modal
   */
  openDiscoveryModal(): void {
    // Get current domain schema
    this.selectionDataService
      .getDomainById(this.domainId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((domainSchema) => {
        if (!domainSchema) {
          // Domain schema not found - silently exit
          return;
        }

        const dialogData: DiscoveryModalDialogData = {
          availableItems: this.availableItems$.value,
          currentSelection: this.selectedItem$.value || undefined,
          domainSchema,
          modalTitle: "Advanced Lookup",
        };

        const dialogRef = this.dialog.open(DiscoveryModalComponent, {
          width: "90vw",
          maxWidth: "1200px",
          height: "80vh",
          data: dialogData,
          panelClass: "discovery-modal-container",
        });

        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((result: DiscoveryModalResult | undefined) => {
            if (result && result.confirmed && result.selectedRow) {
              // Update selection from modal result
              this.setSelection(
                result.selectedRow.originalItem,
                result.selectedRow.queryRef,
                "modal",
              );
            }
          });
      });
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Set the current selection
   */
  private setSelection(
    item: SelectionItem,
    query: Query,
    source: "dropdown" | "modal" | "api",
  ): void {
    const previousItem = this.selectedItem$.value;

    this.selectedItem$.next(item);
    this.selectedQuery$.next(query);

    // Notify form control
    this.onChange(item);

    // Emit selection change event
    this.selectionChange.emit({
      selectedItem: item,
      selectedQuery: query,
      previousSelection: previousItem || undefined,
      timestamp: new Date(),
      source,
    });
  }

  /**
   * Load available items from the service based on current domain
   */
  private loadAvailableItems(): void {
    this.selectionDataService
      .getAvailableItems(this.domainId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.availableItems$.next(items);
      });
  }

  /**
   * Setup debounced search filtering
   */
  private setupSearchDebounce(): void {
    this.searchTerm$
      .pipe(
        debounceTime(300), // 300ms debounce
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || term.trim() === "") {
            // Return all items if search is empty
            return this.selectionDataService.getAvailableItems(this.domainId);
          }
          // Search with term
          return this.selectionDataService.searchItems(term, this.domainId);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((items) => {
        this.availableItems$.next(items);
      });
  }
}
