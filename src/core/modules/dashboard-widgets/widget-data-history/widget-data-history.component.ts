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
  WIDGET_DATA_HISTORY_FAKE_DATA,
  WPO_16698,
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

  renderTimeline() {
    d3.select("#d3-timeline svg").remove();

    const timestamps = this.fakeData.map((d) => d.timestamp);
    if (!timestamps.length) return;

    let startDate: Date,
      endDate: Date,
      allDays: string[] = [];
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
      // Show all years in the data, each with 12 months, each month split into days as segments
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
      // Show a detailed view for a single day
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

    // D3 segmented timeline with dots for each modification and month markers
    const width = document.getElementById("d3-timeline")?.clientWidth || 600;
    const height = 100;
    const margin = { left: 30, right: 30, top: 30, bottom: 30 };
    const svg = d3
      .select("#d3-timeline")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // X scale: each day is a segment
    const x = d3
      .scalePoint()
      .domain(allDays)
      .range([margin.left, width - margin.right]);

    // --- Only render SVG for daily view ---
    // Draw the main horizontal line (for non-daily views, commented out)
    /*
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "var(--bs-gray-200)")
      .attr("stroke-width", 2);

    // Draw vertical lines for each day (for non-daily views, commented out)
    allDays.forEach((day, idx) => {
      const isEndOfMonth =
        idx === allDays.length - 1 ||
        day.slice(0, 7) !== allDays[idx + 1]?.slice(0, 7);
      svg
        .append("line")
        .attr("x1", x(day)!)
        .attr("x2", x(day)!)
        .attr("y1", height / 2 - 18)
        .attr("y2", height / 2 + 18)
        .attr(
          "stroke",
          isEndOfMonth ? "var(--bs-gray-400)" : "var(--bs-gray-200)"
        )
        .attr("stroke-width", 2);
    });
    */

    // Draw dots for modifications inside each day's segment
    const dotRadius = 4;
    if (this.timeframe === "daily" && this.selectedDay) {
      // Add a single center label for the selected day
      svg
        .append("text")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height / 2 - 32)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "var(--bs-gray-700)")
        .text(this.selectedDay);

      // Draw main horizontal line
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", height / 2)
        .attr("y2", height / 2)
        .attr("stroke", "var(--bs-gray-200)")
        .attr("stroke-width", 2);

      // Draw vertical lines at start and end (no month markers)
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

      // 3. Draw dots at the correct time, stacking vertically if they overlap
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
        // Compute x positions for each mod
        const dotPositions: { x: number; mods: any[] }[] = [];
        mods.forEach((mod) => {
          const t = new Date(mod.timestamp).getTime();
          const xPos =
            margin.left +
            ((width - margin.left - margin.right) * (t - minTime)) / timeSpan;
          // Check if a dot already exists at this x (within a small epsilon)
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
        // Draw dots, stacking vertically if they overlap
        dotPositions.forEach((pos) => {
          if (pos.mods.length === 1) {
            svg
              .append("circle")
              .attr("cx", pos.x)
              .attr("cy", height / 2)
              .attr("r", dotRadius)
              .attr("fill", "var(--bs-primary)");
          } else {
            pos.mods.forEach((mod, i) => {
              svg
                .append("circle")
                .attr("cx", pos.x)
                .attr(
                  "cy",
                  height / 2 -
                    ((dotRadius * 2 + 2) * (pos.mods.length - 1)) / 2 +
                    i * (dotRadius * 2 + 2)
                )
                .attr("r", dotRadius)
                .attr("fill", "var(--bs-primary)");
            });
          }
        });
      }
    } else {
      console.log("Not rendering SVG for non-daily view");
      /*
      // For week/month/year/all: spread dots horizontally within each day's segment by time
      const modsByDay: Record<string, any[]> = {};
      for (const mod of this.fakeData) {
        const day = new Date(mod.timestamp).toISOString().slice(0, 10);
        if (!modsByDay[day]) modsByDay[day] = [];
        modsByDay[day].push(mod);
      }
      allDays.forEach((day, idx) => {
        const mods = (modsByDay[day] || []).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        if (mods.length === 0) return;
        // Calculate segment boundaries for this day
        const x0 = x(day)!;
        let x1: number;
        if (idx < allDays.length - 1) {
          x1 = x(allDays[idx + 1])!;
        } else {
          // Last day: estimate segment width as same as previous
          x1 = x0 + (idx > 0 ? x0 - x(allDays[idx - 1])! : 40);
        }
        const minTime = new Date(day + "T00:00:00Z").getTime();
        const maxTime = new Date(day + "T23:59:59Z").getTime();
        const timeSpan = maxTime - minTime || 1;
        mods.forEach((mod) => {
          const t = new Date(mod.timestamp).getTime();
          // Map time to horizontal position within the day's segment
          const xPos = x0 + ((x1 - x0) * (t - minTime)) / timeSpan;
          svg
            .append("circle")
            .attr("cx", xPos)
            .attr("cy", height / 2)
            .attr("r", dotRadius)
            .attr("fill", "var(--bs-primary)");
        });
      });
      */
    }
    // Draw month start/end markers and vertical lines at each ending day
    // (Removed month marker lines and texts)

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
        /*
        // Find first and last day in allDays for this month
        const monthDays = allDays.filter((d) => d.startsWith(month));
        if (monthDays.length) {
          // Start marker
          svg
            .append("line")
            .attr("x1", x(monthDays[0])!)
            .attr("x2", x(monthDays[0])!)
            .attr("y1", height / 2 - 18)
            .attr("y2", height / 2 + 18)
            .attr("stroke", "var(--bs-success)")
            .attr("stroke-width", 2);
          svg
            .append("text")
            .attr("x", x(monthDays[0])!)
            .attr("y", height / 2 - 22)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "var(--bs-success)")
            .text(month);
          // End marker
          const endX = x(monthDays[monthDays.length - 1])!;
          svg
            .append("line")
            .attr("x1", endX)
            .attr("x2", endX)
            .attr("y1", height / 2 - 18)
            .attr("y2", height / 2 + 18)
            .attr("stroke", "var(--bs-danger)")
            .attr("stroke-width", 2);
          svg
            .append("text")
            .attr("x", endX)
            .attr("y", height / 2 + 32)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "var(--bs-danger)")
            .text(month);

          // Add two vertical lines at each ending day: white (5px), then --bs-gray-200 (3px) on top
          svg
            .append("line")
            .attr("x1", endX)
            .attr("x2", endX)
            .attr("y1", height / 2 - 22)
            .attr("y2", height / 2 + 22)
            .attr("stroke", "#fff")
            .attr("stroke-width", 5);
          svg
            .append("line")
            .attr("x1", endX)
            .attr("x2", endX)
            .attr("y1", height / 2 - 22)
            .attr("y2", height / 2 + 22)
            .attr("stroke", "var(--bs-gray-200)")
            .attr("stroke-width", 3);
        }
        */
        // End marker
        //   const endX = x(monthDays[monthDays.length - 1])!;
        //   svg
        //     .append("line")
        //     .attr("x1", endX)
        //     .attr("x2", endX)
        //     .attr("y1", height / 2 - 18)
        //     .attr("y2", height / 2 + 18)
        //     .attr("stroke", "var(--bs-danger)")
        //     .attr("stroke-width", 2);
        //   svg
        //     .append("text")
        //     .attr("x", endX)
        //     .attr("y", height / 2 + 32)
        //     .attr("text-anchor", "middle")
        //     .attr("font-size", 10)
        //     .attr("fill", "var(--bs-danger)")
        //     .text(month);
        //   // Add two vertical lines at each ending day: white (5px), then --bs-gray-200 (3px) on top
        //   svg
        //     .append("line")
        //     .attr("x1", endX)
        //     .attr("x2", endX)
        //     .attr("y1", height / 2 - 22)
        //     .attr("y2", height / 2 + 22)
        //     .attr("stroke", "#fff")
        //     .attr("stroke-width", 5);
        //   svg
        //     .append("line")
        //     .attr("x1", endX)
        //     .attr("x2", endX)
        //     .attr("y1", height / 2 - 22)
        //     .attr("y2", height / 2 + 22)
        //     .attr("stroke", "var(--bs-gray-200)")
        //     .attr("stroke-width", 3);
        // }
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
