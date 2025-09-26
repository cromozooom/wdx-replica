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
  // --- Week Navigation Helpers ---
  weekStartDatesWithNodes: string[] = [];

  /**
   * Given a date, return the ISO string for the start of the week (Sunday).
   */
  getWeekStart(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  }

  /**
   * Compute all week start dates (ISO string) that have at least one node in them.
   */
  computeWeeksWithNodes(): void {
    const allTimestamps = this.fakeData.map((d) => d.timestamp);
    const allDates = allTimestamps.map((ts) => new Date(ts));
    const weekStarts = new Set<string>();
    for (const d of allDates) {
      const weekStart = this.getWeekStart(d);
      weekStarts.add(weekStart);
    }
    this.weekStartDatesWithNodes = Array.from(weekStarts).sort();
  }
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
    const allTimestamps = this.fakeData.map((d) => d.timestamp);
    const allDates = allTimestamps.map((ts) =>
      new Date(ts).toISOString().slice(0, 10)
    );
    this.uniqueDays = Array.from(new Set(allDates)).sort();
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
    } else if (this.timeframe === "week") {
      if (!this.canGoPrevWeek) return;
      const currentWeekStart = this.getWeekStart(this.currentDate);
      const idx = this.weekStartDatesWithNodes.indexOf(currentWeekStart);
      if (idx > 0) {
        // Set currentDate to the first day with nodes in the previous week
        const prevWeekStart = this.weekStartDatesWithNodes[idx - 1];
        const prevWeekNodes = this.fakeData.filter(
          (d) => this.getWeekStart(new Date(d.timestamp)) === prevWeekStart
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
        const nextWeekNodes = this.fakeData.filter(
          (d) => this.getWeekStart(new Date(d.timestamp)) === nextWeekStart
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
    const height = 150;
    const margin = { left: 30, right: 30, top: 30, bottom: 30 };
    const svg = d3
      .select("#d3-timeline")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    if (this.timeframe === "daily" && this.selectedDay) {
      this.renderDailyTimeline(svg, margin, width, height);
    } else if (this.timeframe === "week") {
      this.renderWeeklyTimeline(svg, margin, width, height);
    }
  }

  /**
   * Render the D3 timeline for the weekly view.
   */
  private renderWeeklyTimeline(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    margin: any,
    width: number,
    height: number
  ) {
    // Calculate week start/end
    const dayOfWeek = this.currentDate.getDay();
    const weekStart = new Date(this.currentDate);
    weekStart.setDate(this.currentDate.getDate() - dayOfWeek);
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDays.push(d.toISOString().slice(0, 10));
    }
    // Draw timeline axis
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "var(--bs-gray-200)")
      .attr("stroke-width", 2);

    // Draw 8 vertical lines (7 days = 8 boundaries)
    const numDays = 7;
    const numLines = numDays + 1;
    const daySpacing = (width - margin.left - margin.right) / numDays;
    for (let i = 0; i < numLines; i++) {
      const x = margin.left + i * daySpacing;
      svg
        .append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", height / 2 - 28)
        .attr("y2", height / 2 + 28)
        .attr("stroke", "var(--bs-gray-400)")
        .attr("stroke-width", 2);
    }
    // Draw 7 labels centered between lines
    for (let i = 0; i < numDays; i++) {
      const x = margin.left + (i + 0.5) * daySpacing;
      svg
        .append("text")
        .attr("x", x)
        .attr("y", height / 2 - 52)
        .attr("text-anchor", "middle")
        .attr("font-size", 13)
        .attr("fill", "var(--bs-gray-700)")
        .text(weekDays[i]);
    }
    // For each day, group mods and render a grid in S/coil (snake) pattern
    const dotRadius = 4 * 1.3;
    const gridPadding = 4;
    const dayWidth = daySpacing;
    const dayHeight = 56; // vertical space between the two verticals
    weekDays.forEach((day, idx) => {
      const mods = this.fakeData.filter(
        (mod) => new Date(mod.timestamp).toISOString().slice(0, 10) === day
      );
      if (!mods.length) return;
      const n = mods.length;
      // Compute grid size
      const maxCols = Math.floor(
        (dayWidth - 2 * gridPadding) / (dotRadius * 2 + gridPadding)
      );
      const maxRows = Math.floor(
        (dayHeight - 2 * gridPadding) / (dotRadius * 2 + gridPadding)
      );
      let cols = Math.min(maxCols, n);
      let rows = Math.ceil(n / cols);
      if (rows > maxRows) {
        rows = maxRows;
        cols = Math.ceil(n / rows);
      }
      // Center grid horizontally between verticals
      const gridW = (cols - 1) * (dotRadius * 2 + gridPadding);
      const startX = margin.left + idx * daySpacing + (dayWidth - gridW) / 2;
      const centerY = height / 2;
      for (let i = 0; i < n; i++) {
        // S/coil (snake) pattern: row by row, alternate direction
        const row = Math.floor(i / cols);
        let col = i % cols;
        if (row % 2 === 1) col = cols - 1 - col;
        const x = startX + col * (dotRadius * 2 + gridPadding);
        const y = centerY;
        const mod = mods[i];
        // Color by fieldDisplayName
        const fieldDisplayName = mod?.fieldDisplayName || "Unknown";
        function fieldDisplayNameToColorIndex(name: string) {
          let hash = 0;
          for (let i = 0; i < name.length; i++)
            hash = (hash * 31 + name.charCodeAt(i)) % 68;
          return hash + 1; // 1-based
        }
        const colorIdx = fieldDisplayNameToColorIndex(fieldDisplayName);
        const fillColor = `var(--${colorIdx})`;
        let tooltipHtml = "";
        if (mod) {
          const localTime = new Date(mod.timestamp).toLocaleString();
          tooltipHtml =
            `<div class='position-relative'>` +
            `<strong>Actor:</strong> ${mod.actor?.displayName || ""}<br/>` +
            `<strong>Field:</strong> ${fieldDisplayName}<br/>` +
            `<strong>Time:</strong> ${localTime}<br/>` +
            `<strong>Raw:</strong> ${mod.timestamp}<br/>` +
            (mod.description
              ? `<strong>Description:</strong> ${mod.description}<br/>`
              : "") +
            `<div class='btn-group mt-2'>` +
            `<button class='btn btn-sm btn-primary' data-action='details' >Details</button>` +
            `<button class='btn btn-sm btn-primary' data-action='copy'>Copy</button>` +
            `</div>` +
            `</div>`;
        }
        const circle = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", dotRadius)
          .attr("fill", fillColor);
        // Popper.js tooltip logic (sticky, with close and buttons)
        let popperInstance: any = null;
        let tooltipEl: HTMLElement | null = null;
        let sticky = false;
        let outsideClickHandler: any = null;
        function removeTooltip() {
          if (popperInstance) {
            popperInstance.destroy();
            popperInstance = null;
          }
          if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
          }
          sticky = false;
          if (outsideClickHandler) {
            document.removeEventListener(
              "mousedown",
              outsideClickHandler,
              true
            );
            outsideClickHandler = null;
          }
        }
        circle
          .on("mouseover", function (event: any) {
            if (sticky) return;
            document
              .querySelectorAll(".d3-popper-tooltip")
              .forEach((el) => el.remove());
            tooltipEl = document.createElement("div");
            tooltipEl.className = "d3-popper-tooltip";
            tooltipEl.style.background = "rgba(30,30,30,0.97)";
            tooltipEl.style.color = "#fff";
            tooltipEl.style.padding = "8px 12px";
            tooltipEl.style.borderRadius = "6px";
            tooltipEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
            tooltipEl.style.zIndex = "9999";
            tooltipEl.style.pointerEvents = "auto";
            tooltipEl.innerHTML = tooltipHtml;
            document.body.appendChild(tooltipEl);
            popperInstance = (window as any).Popper.createPopper(
              this,
              tooltipEl,
              {
                placement: "top",
                modifiers: [
                  { name: "offset", options: { offset: [0, 8] } },
                  {
                    name: "preventOverflow",
                    options: { boundary: "viewport" },
                  },
                ],
              }
            );
            // Close button
            tooltipEl
              .querySelector(".d3-tooltip-close")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                removeTooltip();
              });
            // Action buttons
            tooltipEl.querySelectorAll(".d3-tooltip-btn").forEach((btn) => {
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const action = (e.target as HTMLElement).getAttribute(
                  "data-action"
                );
                if (action === "details") {
                  alert("Show details for this modification!");
                } else if (action === "copy") {
                  navigator.clipboard.writeText(JSON.stringify(mod, null, 2));
                }
              });
            });
            sticky = true;
            // Add click-outside handler
            outsideClickHandler = function (e: MouseEvent) {
              if (tooltipEl && !tooltipEl.contains(e.target as Node)) {
                removeTooltip();
              }
            };
            setTimeout(() => {
              document.addEventListener("mousedown", outsideClickHandler, true);
            }, 0);
          })
          .on("mousemove", function (event: any) {
            if (tooltipEl && popperInstance && !sticky) {
              popperInstance.update();
            }
          })
          .on("mouseleave", function () {
            if (!sticky) removeTooltip();
          });
      }
    });
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
    // Count modifications for the selected day
    const modsCount = this.fakeData.filter(
      (mod) =>
        new Date(mod.timestamp).toISOString().slice(0, 10) === this.selectedDay
    ).length;
    svg
      .append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height / 2 - 62) // move up by 20px
      .attr("text-anchor", "middle")
      .attr("font-size", 16)
      .attr("fill", "var(--bs-gray-700)")
      .text(this.selectedDay + (modsCount > 0 ? `  (${modsCount})` : ""));
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
      // Calculate grid size based on number of nodes and available width
      const dayWidth = width - margin.left - margin.right;
      const minSpacing = dotRadius * 2 + 8;
      // Try to fit as many as possible in a single row, but at least 1
      let gridCols = Math.min(mods.length, Math.floor(dayWidth / minSpacing));
      gridCols = Math.max(1, gridCols);
      // If not enough for all, use multiple rows
      const gridRows = Math.ceil(mods.length / gridCols);
      // Center the grid horizontally between the two vertical lines (like weekly view)
      const gridWidth = (gridCols - 1) * minSpacing;
      const startX = margin.left + (dayWidth - gridWidth) / 2;
      const centerY = height / 2;
      for (let idx = 0; idx < mods.length; idx++) {
        const row = Math.floor(idx / gridCols);
        let col = idx % gridCols;
        // Zig-zag: reverse direction every other row
        if (row % 2 === 1) {
          col = gridCols - 1 - col;
        }
        const mod = mods[idx];
        // Color by fieldDisplayName
        const fieldDisplayName = mod?.fieldDisplayName || "Unknown";
        function fieldDisplayNameToColorIndex(name: string) {
          let hash = 0;
          for (let i = 0; i < name.length; i++)
            hash = (hash * 31 + name.charCodeAt(i)) % 68;
          return hash + 1; // 1-based
        }
        const colorIdx = fieldDisplayNameToColorIndex(fieldDisplayName);
        const fillColor = `var(--${colorIdx})`;
        let tooltipHtml = "";
        if (mod) {
          const localTime = new Date(mod.timestamp).toLocaleString();
          tooltipHtml =
            `<div class='position-relative'>` +
            `<strong>Actor:</strong> ${mod.actor?.displayName || ""}<br/>` +
            `<strong>Field:</strong> ${fieldDisplayName}<br/>` +
            `<strong>Time:</strong> ${localTime}<br/>` +
            `<strong>Raw:</strong> ${mod.timestamp}<br/>` +
            (mod.description
              ? `<strong>Description:</strong> ${mod.description}<br/>`
              : "") +
            `<div class='btn-group mt-2'>` +
            `<button class='btn btn-sm btn-primary' data-action='details' >Details</button>` +
            `<button class='btn btn-sm btn-primary' data-action='copy'>Copy</button>` +
            `</div>` +
            `</div>`;
        }
        const circle = svg
          .append("circle")
          .attr("cx", startX + col * minSpacing)
          .attr("cy", centerY + (row - (gridRows - 1) / 2) * minSpacing)
          .attr("r", dotRadius)
          .attr("fill", fillColor);
        // Popper.js tooltip logic (sticky, with close and buttons)
        let popperInstance: any = null;
        let tooltipEl: HTMLElement | null = null;
        let sticky = false;
        let outsideClickHandler: any = null;
        function removeTooltip() {
          if (popperInstance) {
            popperInstance.destroy();
            popperInstance = null;
          }
          if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
          }
          sticky = false;
          if (outsideClickHandler) {
            document.removeEventListener(
              "mousedown",
              outsideClickHandler,
              true
            );
            outsideClickHandler = null;
          }
        }
        circle
          .on("mouseover", function (event: any) {
            if (sticky) return;
            document
              .querySelectorAll(".d3-popper-tooltip")
              .forEach((el) => el.remove());
            tooltipEl = document.createElement("div");
            tooltipEl.className = "d3-popper-tooltip";
            tooltipEl.style.background = "rgba(30,30,30,0.97)";
            tooltipEl.style.color = "#fff";
            tooltipEl.style.padding = "8px 12px";
            tooltipEl.style.borderRadius = "6px";
            tooltipEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
            tooltipEl.style.zIndex = "9999";
            tooltipEl.style.pointerEvents = "auto";
            tooltipEl.innerHTML = tooltipHtml;
            document.body.appendChild(tooltipEl);
            popperInstance = (window as any).Popper.createPopper(
              this,
              tooltipEl,
              {
                placement: "top",
                modifiers: [
                  { name: "offset", options: { offset: [0, 8] } },
                  {
                    name: "preventOverflow",
                    options: { boundary: "viewport" },
                  },
                ],
              }
            );
            // Close button
            tooltipEl
              .querySelector(".d3-tooltip-close")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                removeTooltip();
              });
            // Action buttons
            tooltipEl.querySelectorAll(".d3-tooltip-btn").forEach((btn) => {
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const action = (e.target as HTMLElement).getAttribute(
                  "data-action"
                );
                if (action === "details") {
                  alert("Show details for this modification!");
                } else if (action === "copy") {
                  navigator.clipboard.writeText(JSON.stringify(mod, null, 2));
                }
              });
            });
            sticky = true;
            // Add click-outside handler
            outsideClickHandler = function (e: MouseEvent) {
              if (tooltipEl && !tooltipEl.contains(e.target as Node)) {
                removeTooltip();
              }
            };
            setTimeout(() => {
              document.addEventListener("mousedown", outsideClickHandler, true);
            }, 0);
          })
          .on("mousemove", function (event: any) {
            if (tooltipEl && popperInstance && !sticky) {
              popperInstance.update();
            }
          })
          .on("mouseleave", function () {
            if (!sticky) removeTooltip();
          });
      }
    }
  }

  onDatasetChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idx = select.selectedIndex;
    this.selectedDataset = this.datasets[idx];
    this.fakeData = this.selectedDataset.value;
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

  onGridReady(params: any) {
    this.gridApi = params.api;
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.resetRowHeights();
      }
    }, 200);
  }
}
