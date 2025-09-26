import { FieldTypeIcon, FieldIconMap } from './field-icons';
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

ModuleRegistry.registerModules([RowAutoHeightModule]);

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
  timeframe: "month" | "week" | "year" = "month";
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

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.renderTimeline();
  }

  onTimeframeChange() {
    this.currentDate = new Date();
    this.renderTimeline();
  }

  onPrev() {
    if (this.timeframe === "month") {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        1
      );
    } else if (this.timeframe === "week") {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() - 7);
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
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.timeframe === "year") {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0, 1);
    }
    this.renderTimeline();
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
    } else {
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
    }

    const filledDaysSet = new Set(
      this.fakeData
        .filter((d: any) => {
          const dt = new Date(d.timestamp);
          return dt >= startDate && dt <= endDate;
        })
        .map((d: any) => {
          const dt = new Date(d.timestamp);
          return dt.toISOString().slice(0, 10);
        })
    );

    const width = document.getElementById("d3-timeline")?.clientWidth || 600;
    const height = 60;
    const margin = { left: 30, right: 30, top: 20, bottom: 20 };
    const svg = d3
      .select("#d3-timeline")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3
      .scalePoint()
      .domain(allDays)
      .range([margin.left, width - margin.right]);

    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "var(--bs-gray-200)")
      .attr("stroke-width", 2);

    svg
      .selectAll("circle")
      .data(allDays)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d)!)
      .attr("cy", height / 2)
      .attr("r", (d) => (filledDaysSet.has(d) ? 7 : 5))
      .attr("fill", (d) =>
        filledDaysSet.has(d) ? "var(--bs-primary)" : "#fff"
      )
      .attr("stroke", (d) =>
        filledDaysSet.has(d) ? "var(--bs-primary)" : "var(--bs-gray-200)"
      )
      .attr("stroke-width", 2);

    svg
      .selectAll("text")
      .data(allDays)
      .enter()
      .append("text")
      .attr("x", (d) => x(d)!)
      .attr("y", height / 2 + 22)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#555")
      .text((d) => d.slice(8, 10));
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
