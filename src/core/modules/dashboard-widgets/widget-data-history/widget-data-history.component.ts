import { FieldTypeIcon, FieldIconMap } from "./field-icons";
import { Component, OnInit, AfterViewInit } from "@angular/core";
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
import {
  WPO_16698,
  WIDGET_DATA_HISTORY_FAKE_DATA,
} from "./widget-data-history.dummy-data";

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
  ],
})
export class WidgetDataHistoryComponent implements OnInit, AfterViewInit {
  gridApi: any;
  timeframe: "month" | "week" | "year" | "all" | "daily" = "daily";
  selectedDay: string | null = null;
  currentDate: Date = new Date();
  datasets = [
    { label: "Default", value: WIDGET_DATA_HISTORY_FAKE_DATA },
    { label: "WPO_16698", value: WPO_16698 },
  ];
  selectedDataset = this.datasets[1];
  fakeData: any[] = this.selectedDataset.value;
  columnDefs: ColDef[] = [
    {
      headerName: "Actor",
      field: "actor.displayName",
      cellRenderer: ActorCellRendererComponent,
      enableRowGroup: true,
      width: 180,
    },
    {
      headerName: "Date",
      field: "timestamp",
      valueFormatter: (params: any) => {
        if (params.node?.group && params.colDef.field !== params.node.field)
          return "";
        return new Date(params.value).toLocaleString();
      },
      width: 250,
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

  public autoGroupColumnDef: ColDef = {
    headerName: "Group",
    minWidth: 250,
    cellRendererSelector: (params: any) => {
      if (params.node?.field === "actor.displayName") {
        return { component: AuthorGroupCellRendererComponent };
      }
      if (params.node?.field === "fieldDisplayName") {
        return { component: FieldGroupCellRendererComponent };
      }
      return undefined;
    },
    cellRendererParams: {
      suppressCount: false,
    },
  };

  uniqueDays: string[] = [];

  // --- Computed Properties ---
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

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    // Set selectedDay to the last day with modifications by default
    const allTimestamps = this.fakeData.map((d) => d.timestamp);
    const allDates = allTimestamps.map((ts) =>
      new Date(ts).toISOString().slice(0, 10)
    );
    this.uniqueDays = Array.from(new Set(allDates)).sort();
    this.selectedDay = this.uniqueDays.length
      ? this.uniqueDays[this.uniqueDays.length - 1]
      : null;
  }

  ngAfterViewInit() {
    this.renderTimeline();
  }

  // --- Event Handlers ---
  onTimeframeChange() {
    this.currentDate = new Date();
    if (this.timeframe === "daily") {
      // Default to first day in data
      const allTimestamps = this.fakeData.map((d) => d.timestamp);
      const allDates = allTimestamps.map((ts) =>
        new Date(ts).toISOString().slice(0, 10)
      );
      this.selectedDay = allDates.length ? allDates.sort()[0] : null;
    }
    this.renderTimeline();
  }

  onPrev() {
    if (this.timeframe === "month") {
      this.currentDate = new Date();
      this.renderTimeline();
    } else if (this.timeframe === "week") {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, 0, 1);
    }
    this.renderTimeline();
  }

  onNext() {
    if (this.timeframe === "month") {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );
    } else if (this.timeframe === "week") {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.timeframe === "year") {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0, 1);
    }
    this.renderTimeline();
  }

  goPrevDay() {
    if (!this.canGoPrevDay) return;
    const idx = this.uniqueDays.indexOf(this.selectedDay!);
    if (idx > 0) {
      this.selectedDay = this.uniqueDays[idx - 1];
      this.renderTimeline();
    }
  }
  goNextDay() {
    if (!this.canGoNextDay) return;
    const idx = this.uniqueDays.indexOf(this.selectedDay!);
    if (idx < this.uniqueDays.length - 1) {
      this.selectedDay = this.uniqueDays[idx + 1];
      this.renderTimeline();
    }
  }

  // --- Timeline Rendering ---
  renderTimeline() {
    d3.select("#d3-timeline svg").remove();
    const timestamps = this.fakeData.map((d) => d.timestamp);
    if (!timestamps.length) return;
    let startDate: Date,
      endDate: Date,
      allDays: string[] = [];

    // Compute allDays for each timeframe
    if (this.timeframe === "month") {
      startDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        1
      );
      endDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        0
      );
      const daysInMonth = endDate.getDate();
      allDays = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          i + 1
        );
        return d.toISOString().slice(0, 10);
      });
    } else if (this.timeframe === "week") {
      const dayOfWeek = this.currentDate.getDay();
      startDate = new Date(this.currentDate);
      startDate.setDate(this.currentDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      allDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
    } else if (this.timeframe === "year") {
      startDate = new Date(this.currentDate.getFullYear(), 0, 1);
      endDate = new Date(this.currentDate.getFullYear(), 11, 31);
      const daysInYear =
        Math.floor(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      allDays = Array.from({ length: daysInYear }, (_, i) => {
        const d = new Date(this.currentDate.getFullYear(), 0, 1);
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
    } else if (this.timeframe === "all") {
      const allTimestampsAll = this.fakeData.map((d) => d.timestamp);
      const allDatesAll = allTimestampsAll.map((ts) => new Date(ts));
      if (allDatesAll.length > 0) {
        const minYear = Math.min(...allDatesAll.map((d) => d.getFullYear()));
        const maxYear = Math.max(...allDatesAll.map((d) => d.getFullYear()));
        startDate = new Date(minYear, 0, 1);
        endDate = new Date(maxYear, 11, 31);
        allDays = [];
        for (let year = minYear; year <= maxYear; year++) {
          for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
              const d = new Date(year, month, day);
              allDays.push(d.toISOString().slice(0, 10));
            }
          }
        }
      } else {
        startDate = endDate = new Date();
        allDays = [];
      }
    } else if (this.timeframe === "daily") {
      const allTimestampsDaily = this.fakeData.map((d) => d.timestamp);
      const allDatesDaily = allTimestampsDaily.map((ts) =>
        new Date(ts).toISOString().slice(0, 10)
      );
      const uniqueDays = Array.from(new Set(allDatesDaily)).sort();
      if (!this.selectedDay && uniqueDays.length) {
        this.selectedDay = uniqueDays[0];
      }
      allDays = this.selectedDay ? [this.selectedDay] : [];
      if (this.selectedDay) {
        startDate = endDate = new Date(this.selectedDay);
      } else {
        startDate = endDate = new Date();
      }
    }

    const width = document.getElementById("d3-timeline")?.clientWidth || 600;
    const height = 100;
    const margin = { left: 30, right: 30, top: 30, bottom: 30 };
    const svg = d3
      .select("#d3-timeline")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    if (this.timeframe === "daily" && this.selectedDay) {
      this.renderDailyTimeline(svg, margin, width, height);
    }

    // Draw month start/end markers and vertical lines at each ending day
    if (allDays.length > 0) {
      const months: string[] = [];
      allDays.forEach((d) => {
        const m = d.slice(0, 7); // YYYY-MM
        if (months.length === 0 || months[months.length - 1] !== m) {
          months.push(m);
        }
      });
      months.forEach((month, idx) => {
        // Optionally render month markers here
        // console.log("Month:", month);
      });
    }
  }
  /**
   * Render the D3 timeline for the daily view.
   */
  private renderDailyTimeline(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    margin: any,
    width: number,
    height: number
  ) {
    const dotRadius = 4 * 1.3; // 30% bigger
    svg
      .append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height / 2 - 32)
      .attr("text-anchor", "middle")
      .attr("font-size", 16)
      .attr("fill", "var(--bs-gray-700)")
      .text(this.selectedDay);
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "var(--bs-gray-200)")
      .attr("stroke-width", 2);
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left)
      .attr("y1", height / 2 - 28)
      .attr("y2", height / 2 + 28)
      .attr("stroke", "var(--bs-gray-400)")
      .attr("stroke-width", 2);
    svg
      .append("line")
      .attr("x1", width - margin.right)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2 - 28)
      .attr("y2", height / 2 + 28)
      .attr("stroke", "var(--bs-gray-400)")
      .attr("stroke-width", 2);
    const mods = this.fakeData
      .filter(
        (mod) =>
          new Date(mod.timestamp).toISOString().slice(0, 10) ===
          this.selectedDay
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    if (mods.length > 0) {
      const minTime = new Date(this.selectedDay + "T00:00:00Z").getTime();
      const maxTime = new Date(this.selectedDay + "T23:59:59Z").getTime();
      const timeSpan = maxTime - minTime || 1;
      const dotPositions: { x: number; mods: any[] }[] = [];
      mods.forEach((mod) => {
        const t = new Date(mod.timestamp).getTime();
        const xPos =
          margin.left +
          ((width - margin.left - margin.right) * (t - minTime)) / timeSpan;
        const epsilon = 2; // px
        let found = false;
        for (const pos of dotPositions) {
          if (Math.abs(pos.x - xPos) < epsilon) {
            pos.mods.push(mod);
            found = true;
            break;
          }
        }
        if (!found) {
          dotPositions.push({ x: xPos, mods: [mod] });
        }
      });
      dotPositions.forEach((pos) => {
        if (pos.mods.length === 1) {
          svg
            .append("circle")
            .attr("cx", pos.x)
            .attr("cy", height / 2)
            .attr("r", dotRadius)
            .attr("fill", "var(--bs-primary)");
        } else {
          // Increase vertical spacing between circles by 30%
          const spacing = dotRadius * 2 + 2;
          const increasedSpacing = spacing * 1.3;
          pos.mods.forEach((mod, i) => {
            svg
              .append("circle")
              .attr("cx", pos.x)
              .attr(
                "cy",
                height / 2 -
                  (increasedSpacing * (pos.mods.length - 1)) / 2 +
                  i * increasedSpacing
              )
              .attr("r", dotRadius)
              .attr("fill", "var(--bs-primary)");
          });
        }
      });
    }
  }

  onDatasetChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idx = select.selectedIndex;
    this.selectedDataset = this.datasets[idx];
    this.fakeData = this.selectedDataset.value;
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.resetRowHeights();
      }
    }, 100);
    this.renderTimeline();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.resetRowHeights();
      }
    }, 200);
  }
}
