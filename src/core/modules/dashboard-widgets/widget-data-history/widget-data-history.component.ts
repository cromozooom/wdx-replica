// (Removed duplicate/stray class and method stubs. File now starts with imports and a single class definition.)
import { signalState } from "@ngrx/signals";
import { patchState } from "@ngrx/signals";
import { FieldTypeIcon, FieldIconMap } from "./field-icons";
import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from "@angular/core";
import { ColDef, RowAutoHeightModule, ModuleRegistry } from "ag-grid-community";
import * as d3 from "d3";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridModule } from "ag-grid-angular";
import { ActorCellRendererComponent } from "./actor-cell-renderer.component";
import { MultilineCellRenderer } from "./multiline-cell-renderer.component";
import { FieldIconCellRendererComponent } from "./field-icon-cell-renderer.component";
import { AuthorGroupCellRendererComponent } from "./author-group-cell-renderer.component";
import { FieldGroupCellRendererComponent } from "./field-group-cell-renderer.component";

ModuleRegistry.registerModules([RowAutoHeightModule]);

import {
  WPO_16698,
  WIDGET_DATA_HISTORY_FAKE_DATA,
} from "./widget-data-history.dummy-data";
import { GridHistoryDataComponent } from "./grid-history-data.component";
import { HistoryVisualisationDataComponent } from "./history-visualisation-data.component";

@Component({
  selector: "app-widget-data-history",
  standalone: true,
  templateUrl: "./widget-data-history.component.html",
  styleUrls: ["./widget-data-history.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    AgGridModule,
    ActorCellRendererComponent,
    MultilineCellRenderer,
    FieldIconCellRendererComponent,
    AuthorGroupCellRendererComponent,
    FieldGroupCellRendererComponent,
    GridHistoryDataComponent,
    HistoryVisualisationDataComponent,
  ],
})
export class WidgetDataHistoryComponent implements OnInit, AfterViewInit {
  constructor(private cdr: ChangeDetectorRef) {}
  datasets = [
    { label: "Default", value: WIDGET_DATA_HISTORY_FAKE_DATA },
    { label: "WPO_16698", value: WPO_16698 },
  ];
  selectedDataset = this.datasets[1];
  dataStore = signalState<{ data: any[] }>({
    data: this.selectedDataset.value,
  });
  gridApi: any;
  syncData: boolean = false;

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
        return params.data?.from?.displayValue;
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
        return params.data?.to?.displayValue;
      },
      wrapText: true,
      autoHeight: true,
      cellRenderer: MultilineCellRenderer,
      cellStyle: { whiteSpace: "pre-line", wordBreak: "break-word" },
    },
  ];

  // Provide filteredData for template compatibility (update with real filtering logic if needed)
  get filteredData(): any[] {
    return this.dataStore.data();
  }
  get fakeData(): any[] {
    return this.dataStore.data();
  }

  // --- Timeline/Navigation State ---

  onDatasetChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idx = select.selectedIndex;
    this.selectedDataset = this.datasets[idx];
    patchState(this.dataStore, { data: this.selectedDataset.value });
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
