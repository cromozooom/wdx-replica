import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
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
import { NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { BehaviorSubject, Subject, Observable } from "rxjs";
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from "rxjs/operators";
import { SelectionItem } from "../models/selection-item.interface";
import { Query } from "../models/query.interface";
import { FlatSelectionRow } from "../models/flat-selection-row.interface";
import { SelectionChangeEvent } from "../models/selection-change-event.interface";
import { SelectionDataService } from "../services/selection-data.service";
import { PreviewContainerComponent } from "./preview-container/preview-container.component";
import {
  DiscoveryModalComponent,
  DiscoveryModalDialogData,
  DiscoveryModalResult,
} from "./discovery-modal/discovery-modal.component";
import { DomainSchema } from "../models/domain-schema.interface";
import { OffcanvasStackService } from "../services/offcanvas-stack.service";

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
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
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

  /** Available (item, query) combinations for selection */
  public availableRows$ = new BehaviorSubject<FlatSelectionRow[]>([]);

  /** Currently selected row (item+query) */
  public selectedRow$ = new BehaviorSubject<FlatSelectionRow | null>(null);

  /** Performance tracking */
  public performanceMetrics = {
    lastLoadTime: 0,
    lastFilterTime: 0,
    totalRows: 0,
    filteredRows: 0,
  };

  /** Loading state for displaying spinner/skeleton */
  public isLoading = false;

  /** Getter for selectedRow to support ngModel two-way binding */
  public get selectedRow(): FlatSelectionRow | null {
    return this.selectedRow$.value;
  }

  /** Setter for selectedRow to support ngModel two-way binding */
  public set selectedRow(value: FlatSelectionRow | null) {
    this.selectedRow$.next(value);
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
    private offcanvasService: NgbOffcanvas,
    private offcanvasStackService: OffcanvasStackService,
  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnInit(): void {
    this.loadAvailableItems();
    this.setupSearchDebounce();

    // Optionally set initial selection if provided (not implemented for flat rows)
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload items when domainId changes (skip first change as ngOnInit handles it)
    if (changes["domainId"] && !changes["domainId"].firstChange) {
      console.log(
        `🔄 [Component] Domain changed from "${changes["domainId"].previousValue}" to "${changes["domainId"].currentValue}"`,
      );
      this.loadAvailableItems();
      // Clear selection when domain changes to prevent showing items from wrong domain
      this.clearSelection();
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
      // Value should be a FlatSelectionRow or uniqueId
      if (typeof value === "string") {
        // Try to find the row by uniqueId
        const row = this.availableRows$.value.find((r) => r.uniqueId === value);
        if (row) {
          this.setSelection(row, "api");
        }
      } else if (value && typeof value === "object" && "uniqueId" in value) {
        this.setSelection(value, "api");
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
    const previousRow = this.selectedRow$.value;
    this.selectedRow$.next(null);
    this.onChange(null);
    this.selectionChange.emit({
      selectedItem: null,
      selectedQuery: null,
      previousSelection: previousRow?.originalItem || undefined,
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
  onSelectionChange(row: FlatSelectionRow | null): void {
    if (row) {
      this.setSelection(row, "dropdown");
    } else {
      this.clearSelection();
    }
    this.onTouched();
  }

  /**
   * Handle search input change
   */
  onSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  /**
   * Open advanced discovery offcanvas
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

        const nextWidth = this.offcanvasStackService.getNextOffcanvasWidth();
        const currentLevel = this.offcanvasStackService.getStackDepth();
        const { zIndex, backdropZIndex } =
          this.offcanvasStackService.getNextZIndexes();
        const offcanvasRef = this.offcanvasService.open(
          DiscoveryModalComponent,
          {
            position: "end",
            backdrop: "static",
            scroll: true,
            panelClass: "offcanvas-dynamic-width",
          },
        );

        // Set the dynamic width and z-index using CSS custom properties
        setTimeout(() => {
          const offcanvasElement = document.querySelectorAll(".offcanvas.show")[
            document.querySelectorAll(".offcanvas.show").length - 1
          ] as HTMLElement;

          // Find the corresponding backdrop
          const backdropElements = Array.from(
            document.querySelectorAll(".offcanvas-backdrop"),
          );
          const latestBackdrop = backdropElements[
            backdropElements.length - 1
          ] as HTMLElement;

          if (offcanvasElement) {
            offcanvasElement.style.setProperty(
              "--bs-offcanvas-width",
              nextWidth,
            );
            offcanvasElement.style.width = nextWidth;
            offcanvasElement.style.zIndex = zIndex.toString();

            // For stacked offcanvas (not the first one), reduce height and align to bottom
            if (currentLevel > 0) {
              const heightReduction = currentLevel * 3; // 3rem per level
              offcanvasElement.style.height = `calc(100% - ${heightReduction}rem)`;
              offcanvasElement.style.marginTop = "auto";
            }
          }

          if (latestBackdrop) {
            latestBackdrop.style.zIndex = backdropZIndex.toString();
          }
        }, 0);

        // Register with stack service
        this.offcanvasStackService.registerOffcanvas(
          "Advanced Lookup",
          offcanvasRef,
        );

        // Pass data to offcanvas via component instance
        offcanvasRef.componentInstance.data = {
          availableItems: this.availableRows$.value,
          currentSelection: this.selectedRow$.value || undefined,
          domainSchema,
          modalTitle: "Advanced Lookup",
        };

        offcanvasRef.result
          .then((result: DiscoveryModalResult) => {
            if (result && result.confirmed && result.selectedRow) {
              // Update selection from offcanvas result
              this.setSelection(result.selectedRow, "modal");
            }
          })
          .catch(() => {
            // Offcanvas dismissed without selection
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
    row: FlatSelectionRow,
    source: "dropdown" | "modal" | "api",
  ): void {
    const previousRow = this.selectedRow$.value;
    this.selectedRow$.next(row);
    // Notify form control
    this.onChange(row);
    // Emit selection change event (preserve legacy shape for now)
    this.selectionChange.emit({
      selectedItem: row.originalItem,
      selectedQuery: row.queryRef,
      previousSelection: previousRow?.originalItem || undefined,
      timestamp: new Date(),
      source,
    });
  }

  /**
   * Load available items from the service based on current domain
   */
  private loadAvailableItems(): void {
    const startTime = performance.now();
    console.log(`📥 [Selector] Loading items for domain: "${this.domainId}"`);

    // Show loading indicator
    this.isLoading = true;

    this.selectionDataService
      .getAvailableItems(this.domainId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        const flattenStart = performance.now();
        const rows = this.selectionDataService.flattenToGridRows(items);
        const flattenTime = performance.now() - flattenStart;
        const totalTime = performance.now() - startTime;

        this.performanceMetrics.lastLoadTime = totalTime;
        this.performanceMetrics.totalRows = rows.length;
        this.performanceMetrics.filteredRows = rows.length;

        console.log(
          `📊 [Selector] Flattened to ${rows.length} (item, query) combinations`,
        );
        console.log(
          `⚡ [Performance] Load: ${totalTime.toFixed(2)}ms (Flatten: ${flattenTime.toFixed(2)}ms)`,
        );

        this.availableRows$.next(rows);

        // Hide loading indicator
        this.isLoading = false;
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
          const filterStart = performance.now();

          if (!term || term.trim() === "") {
            // Return all items if search is empty
            return this.selectionDataService.getAvailableItems(this.domainId);
          }
          // Search with term
          console.log(`🔍 [Selector] Searching for: "${term}"`);
          return this.selectionDataService.searchItems(term, this.domainId);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((items) => {
        const flattenStart = performance.now();
        const rows = this.selectionDataService.flattenToGridRows(items);
        const filterTime = performance.now() - flattenStart;

        this.performanceMetrics.lastFilterTime = filterTime;
        this.performanceMetrics.filteredRows = rows.length;

        console.log(
          `⚡ [Performance] Filter: ${filterTime.toFixed(2)}ms (${rows.length}/${this.performanceMetrics.totalRows} rows)`,
        );

        this.availableRows$.next(rows);
      });
  }
}
