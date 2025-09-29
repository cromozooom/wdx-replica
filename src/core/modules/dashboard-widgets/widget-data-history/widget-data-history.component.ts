// (Removed duplicate/stray class and method stubs. File now starts with imports and a single class definition.)

import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
} from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ZIndexService } from "../../../services/z-index.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridModule } from "ag-grid-angular";
import { NgSelectModule } from "@ng-select/ng-select";
import { ColDef } from "ag-grid-community";
import { signalState, patchState } from "@ngrx/signals";
import { FieldTypeIcon, FieldIconMap } from "./field-icons";
import {
  WIPO_16698,
  WIDGET_DATA_HISTORY_FAKE_DATA,
} from "./widget-data-history.dummy-data";
import { GridHistoryDataComponent } from "./grid-history-data.component";
import { D3DataHistoryComponent } from "./d3-data-history.component";
import { ActorCellRendererComponent } from "./actor-cell-renderer.component";
import { MultilineCellRenderer } from "./multiline-cell-renderer.component";
import { FieldIconCellRendererComponent } from "./field-icon-cell-renderer.component";
import { AuthorGroupCellRendererComponent } from "./author-group-cell-renderer.component";
import { FieldGroupCellRendererComponent } from "./field-group-cell-renderer.component";
import { WidgetLayoutComponent } from "../../../../app/widget-layout/widget-layout.component";

@Component({
  selector: "app-widget-data-history",
  standalone: true,
  templateUrl: "./widget-data-history.component.html",
  styleUrls: ["./widget-data-history.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    AgGridModule,
    NgSelectModule,
    // Removed unused cell renderer components from imports
    GridHistoryDataComponent,
    D3DataHistoryComponent,
    WidgetLayoutComponent,
  ],
})
export class WidgetDataHistoryComponent implements OnInit, AfterViewInit {
  @ViewChild("content") contentTpl!: TemplateRef<any>;
  private modalRef?: NgbModalRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private zIndexService: ZIndexService
  ) {}

  openFullscreenModal(data?: any) {
    // Optionally store data for modal use
    const zIndex = this.zIndexService.next();
    this.modalRef = this.modalService.open(this.contentTpl, {
      fullscreen: true,
      windowClass: "custom-modal-z",
    });
    // After the modal is attached, set its z-index
    setTimeout(() => {
      const modalEl = document.querySelector(
        ".modal.custom-modal-z"
      ) as HTMLElement;
      if (modalEl) {
        modalEl.style.zIndex = zIndex.toString();
      }
    }, 0);
    // Reset filters when modal closes
    this.modalRef.closed.subscribe(() => {
      this.d3SelectedFields = [];
      this.d3SelectedAuthors = [];
      this.applyAllFilters();
      this.cdr.detectChanges();
    });
    this.modalRef.dismissed.subscribe(() => {
      this.d3SelectedFields = [];
      this.d3SelectedAuthors = [];
      this.applyAllFilters();
      this.cdr.detectChanges();
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = undefined;
    }
  }
  showTimeline = true;
  hideInitialValues = false;
  filteredDataArray: any[] = [];
  // Store filter state
  d3SelectedFields: string[] = [];
  d3SelectedAuthors: string[] = [];
  datasets = [
    { label: "Default", value: WIDGET_DATA_HISTORY_FAKE_DATA },
    { label: "WIPO_16698", value: WIPO_16698 },
  ];
  selectedDataset = this.datasets[1];
  dataStore = signalState<{ data: any[] }>({
    data: this.selectedDataset.value,
  });
  gridApi: any;
  syncData: boolean = false;

  public fieldNames: string[] = [];
  public authorNames: string[] = [];
  public columnDefs: ColDef[] = [
    {
      width: 250,
      headerName: "Author",
      filter: true,
      floatingFilter: true,
      field: "actor.displayName",
      valueGetter: (params: any) => {
        // If this is a group row and grouping by Author, show the group key (author name)
        if (params.node?.group && params.colDef.field === params.node.field) {
          return params.node.key;
        }
        // For other group rows, show nothing
        if (params.node?.group) return "";
        return params.data?.actor?.displayName;
      },
      cellRendererSelector: (params: any) => {
        // If this is a group row and grouping by Author, use the group cell renderer
        if (params.node?.group && params.colDef.field === params.node.field) {
          return {
            component: AuthorGroupCellRendererComponent,
            params: {},
          };
        }
        // For all other rows, use the Angular cell renderer
        if (!params.node?.group) {
          return {
            component: ActorCellRendererComponent,
            params: {},
          };
        }
        return undefined;
      },
      enableRowGroup: true,
    },
    {
      width: 250,
      headerName: "Date",
      field: "timestamp",
      valueFormatter: (params: any) => {
        if (params.node?.group && params.colDef.field !== params.node.field)
          return "";
        return new Date(params.value).toLocaleString();
      },
    },
    {
      headerName: "Field",
      filter: true,
      floatingFilter: true,
      field: "fieldDisplayName",
      cellRenderer: FieldIconCellRendererComponent,
      enableRowGroup: true,
    },
    { headerName: "Field ID", field: "fieldId", hide: true },
    {
      width: 580,
      headerName: "From",
      valueGetter: (params: any) => {
        if (params.node?.group && params.colDef.field !== params.node.field)
          return "";
        const val = params.data?.from?.displayValue;
        return val !== undefined && val !== null && val !== "" ? val : "-";
      },
      wrapText: true,
      autoHeight: true,
      cellRenderer: MultilineCellRenderer,
      cellStyle: { whiteSpace: "pre-line", wordBreak: "break-word" },
    },
    {
      width: 580,
      headerName: "To",
      valueGetter: (params: any) => {
        if (params.node?.group && params.colDef.field !== params.node.field)
          return "";
        const val = params.data?.to?.displayValue;
        return val !== undefined && val !== null && val !== "" ? val : "-";
      },
      wrapText: true,
      autoHeight: true,
      cellRenderer: MultilineCellRenderer,
      cellStyle: { whiteSpace: "pre-line", wordBreak: "break-word" },
    },
  ];
  updateFieldAndAuthorNames() {
    const data = this.dataStore.data();
    this.fieldNames = Array.from(
      new Set(data.map((d: any) => d.fieldDisplayName).filter(Boolean))
    );
    this.authorNames = Array.from(
      new Set(
        data.map((d: any) => d.actor && d.actor.displayName).filter(Boolean)
      )
    );
  }

  // Provide filteredData for template compatibility (update with real filtering logic if needed)
  get filteredData() {
    // Kept for compatibility, but not used for ag-grid rowData anymore
    return this.filteredDataArray;
  }
  onD3FilterChanged(filter: { fields: string[]; authors: string[] }) {
    this.d3SelectedFields = filter.fields;
    this.d3SelectedAuthors = filter.authors;
    this.applyAllFilters();
  }

  onToggleHideInitialValues() {
    this.hideInitialValues = !this.hideInitialValues;
    this.applyAllFilters();
  }

  applyAllFilters() {
    // Start with all data
    let data = this.dataStore.data();
    // 1. Field/author filter
    if (this.d3SelectedFields.length || this.d3SelectedAuthors.length) {
      data = data.filter((d: any) => {
        const fieldMatch =
          !this.d3SelectedFields.length ||
          this.d3SelectedFields.includes(d.fieldDisplayName);
        const authorMatch =
          !this.d3SelectedAuthors.length ||
          (d.actor && this.d3SelectedAuthors.includes(d.actor.displayName));
        return fieldMatch && authorMatch;
      });
    }
    // 2. Hide initial values (fields with only one timestamp)
    if (this.hideInitialValues) {
      const fieldCounts = new Map<string, number>();
      for (const d of data) {
        if (!d.fieldDisplayName) continue;
        fieldCounts.set(
          d.fieldDisplayName,
          (fieldCounts.get(d.fieldDisplayName) || 0) + 1
        );
      }
      const multiFields = new Set(
        Array.from(fieldCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([field]) => field)
      );
      data = data.filter((d) => multiFields.has(d.fieldDisplayName));
    }
    this.filteredDataArray = [...data];
    this.cdr.detectChanges();
    if (this.gridApi) {
      this.gridApi.setRowData(this.filteredDataArray);
      setTimeout(() => {
        this.gridApi.resetRowHeights();
      }, 0);
    }
  }

  onGridReady(event: any) {
    this.gridApi = event.api;
    // Set initial data
    this.filteredDataArray = this.getInitialFilteredData();
    if (this.gridApi && typeof this.gridApi.setRowData === "function") {
      this.gridApi.setRowData(this.filteredDataArray);
    }
  }

  getInitialFilteredData() {
    const data = this.dataStore.data();
    if (!this.d3SelectedFields.length && !this.d3SelectedAuthors.length) {
      return [...data];
    }
    return data.filter((d: any) => {
      const fieldMatch =
        !this.d3SelectedFields.length ||
        this.d3SelectedFields.includes(d.fieldDisplayName);
      const authorMatch =
        !this.d3SelectedAuthors.length ||
        (d.actor && this.d3SelectedAuthors.includes(d.actor.displayName));
      return fieldMatch && authorMatch;
    });
  }
  get fakeData(): any[] {
    return this.dataStore.data();
  }

  // --- Timeline/Navigation State ---

  onDatasetChange(selected: any) {
    this.selectedDataset = selected;
    patchState(this.dataStore, { data: this.selectedDataset.value });
    this.updateFieldAndAuthorNames();
    // Reset filters after updating available options
    this.d3SelectedFields = [];
    this.d3SelectedAuthors = [];
    this.applyAllFilters();
    this.cdr.detectChanges();
    this.computeWeeksWithNodes();
    // If in week mode, ensure currentDate is a valid week
    if (this.timeframe === "week" && this.weekStartDatesWithNodes.length) {
      const currentWeekStart = this.getWeekStart(this.currentDate);
      if (!this.weekStartDatesWithNodes.includes(currentWeekStart)) {
        this.currentDate = new Date(this.weekStartDatesWithNodes[0]);
      }
    }
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.resetRowHeights();
      }
    }, 100);
    this.renderTimeline();
  }
  timeframe: "month" | "week" | "year" | "all" | "daily" = "daily";
  selectedDay: string | null = null;
  currentDate: Date = new Date();
  weekStartDatesWithNodes: string[] = [];
  uniqueDays: string[] = [];

  // --- Navigation Computed Properties ---
  get canGoPrevDay(): boolean {
    if (this.timeframe !== "daily" || !this.selectedDay) return false;
    return this.uniqueDays.indexOf(this.selectedDay) > 0;
  }
  get canGoNextDay(): boolean {
    if (this.timeframe !== "daily" || !this.selectedDay) return false;
    return (
      this.uniqueDays.indexOf(this.selectedDay) < this.uniqueDays.length - 1
    );
  }
  get canGoPrevWeek(): boolean {
    if (this.timeframe !== "week" || !this.weekStartDatesWithNodes.length)
      return false;
    const currentWeekStart = this.getWeekStart(this.currentDate);
    const idx = this.weekStartDatesWithNodes.indexOf(currentWeekStart);
    return idx > 0;
  }
  get canGoNextWeek(): boolean {
    if (this.timeframe !== "week" || !this.weekStartDatesWithNodes.length)
      return false;
    const currentWeekStart = this.getWeekStart(this.currentDate);
    const idx = this.weekStartDatesWithNodes.indexOf(currentWeekStart);
    return idx >= 0 && idx < this.weekStartDatesWithNodes.length - 1;
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.updateFieldAndAuthorNames();
    // Set selectedDay to the last day with modifications by default
    const allTimestamps = this.dataStore.data().map((d: any) => d.timestamp);
    const allDates = allTimestamps.map((ts: any) =>
      new Date(ts).toISOString().slice(0, 10)
    );
    this.uniqueDays = Array.from(new Set(allDates)).sort() as string[];
    this.selectedDay = this.uniqueDays.length
      ? this.uniqueDays[this.uniqueDays.length - 1]
      : null;
    this.computeWeeksWithNodes();
    // If in week mode, ensure currentDate is a valid week
    if (this.timeframe === "week" && this.weekStartDatesWithNodes.length) {
      const currentWeekStart = this.getWeekStart(this.currentDate);
      if (!this.weekStartDatesWithNodes.includes(currentWeekStart)) {
        this.currentDate = new Date(this.weekStartDatesWithNodes[0]);
      }
    }
  }

  ngAfterViewInit() {
    this.renderTimeline();
  }

  // --- Event Handlers ---
  onTimeframeChange() {
    this.currentDate = new Date();
    if (this.timeframe === "daily") {
      // Default to first day in data
      const allTimestamps = this.dataStore.data().map((d: any) => d.timestamp);
      const allDates = allTimestamps.map((ts: any) =>
        new Date(ts).toISOString().slice(0, 10)
      );
      this.selectedDay = allDates.length
        ? (allDates.sort()[0] as string)
        : null;
    }
    this.renderTimeline();
  }

  goPrevDay() {
    if (!this.canGoPrevDay) return;
    const idx = this.uniqueDays.indexOf(this.selectedDay!);
    if (idx > 0) {
      this.selectedDay = this.uniqueDays[idx - 1];
      this.renderTimeline();
      this.cdr.detectChanges();
    }
  }
  goNextDay() {
    if (!this.canGoNextDay) return;
    const idx = this.uniqueDays.indexOf(this.selectedDay!);
    if (idx < this.uniqueDays.length - 1) {
      this.selectedDay = this.uniqueDays[idx + 1];
      this.renderTimeline();
      this.cdr.detectChanges();
    }
  }

  // --- Week Navigation Helpers ---
  getWeekStart(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  }
  computeWeeksWithNodes(): void {
    const allTimestamps = this.dataStore.data().map((d: any) => d.timestamp);
    const allDates = allTimestamps.map((ts: any) => new Date(ts));
    const weekStarts = new Set<string>();
    for (const d of allDates) {
      const weekStart = this.getWeekStart(d);
      weekStarts.add(weekStart);
    }
    this.weekStartDatesWithNodes = Array.from(weekStarts).sort();
  }

  // --- D3 Timeline Render Stub ---
  renderTimeline() {
    // This is a stub. Actual D3 rendering is handled by the child component.
    return this.dataStore.data();
  }

  // --- ag-Grid Event Handler Stub ---
  onPrev() {
    if (this.timeframe === "month") {
      this.currentDate = new Date();
    } else if (this.timeframe === "week") {
      if (!this.canGoPrevWeek) return;
      const currentWeekStart = this.getWeekStart(this.currentDate);
      const idx = this.weekStartDatesWithNodes.indexOf(currentWeekStart);
      if (idx > 0) {
        // Set currentDate to the first day with nodes in the previous week
        const prevWeekStart = this.weekStartDatesWithNodes[idx - 1];
        const prevWeekNodes = this.dataStore
          .data()
          .filter(
            (d: any) =>
              this.getWeekStart(new Date(d.timestamp)) === prevWeekStart
          );
        if (prevWeekNodes.length) {
          // Set to the first node's date in that week
          this.currentDate = new Date(prevWeekNodes[0].timestamp);
        } else {
          this.currentDate = new Date(prevWeekStart);
        }
      }
    } else if (this.timeframe === "year") {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, 0, 1);
    }
    this.renderTimeline();
    this.cdr.detectChanges();
  }

  onNext() {
    if (this.timeframe === "month") {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );
    } else if (this.timeframe === "week") {
      if (!this.canGoNextWeek) return;
      const currentWeekStart = this.getWeekStart(this.currentDate);
      const idx = this.weekStartDatesWithNodes.indexOf(currentWeekStart);
      if (idx >= 0 && idx < this.weekStartDatesWithNodes.length - 1) {
        // Set currentDate to the first day with nodes in the next week
        const nextWeekStart = this.weekStartDatesWithNodes[idx + 1];
        const nextWeekNodes = this.dataStore
          .data()
          .filter(
            (d: any) =>
              this.getWeekStart(new Date(d.timestamp)) === nextWeekStart
          );
        if (nextWeekNodes.length) {
          this.currentDate = new Date(nextWeekNodes[0].timestamp);
        } else {
          this.currentDate = new Date(nextWeekStart);
        }
      }
    } else if (this.timeframe === "year") {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0, 1);
    }
    this.renderTimeline();
    this.cdr.detectChanges();
  }
}
