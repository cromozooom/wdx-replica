// Enum for icons to associate with each field type
export enum FieldIcon {
  RemoteWorkItemLink = "fas fa-link",
  Link = "fas fa-link",
  Status = "fas fa-flag",
  Assignee = "fas fa-user",
  TAApprovalDate = "fas fa-calendar-check",
  TAApprovalStatus = "fas fa-check-circle",
  TAApprover = "fas fa-user-tie",
  TAComments = "fas fa-comment-dots",
  DAApprovalDate = "fas fa-calendar-check",
  DAApprover = "fas fa-user-tie",
  DAApprovalStatus = "fas fa-check-circle",
  DAComments = "fas fa-comment-dots",
  DesignApproval = "fas fa-drafting-compass",
  Description = "fas fa-align-left",
}

// Map fieldDisplayName to icon class
export const FieldIconMap: Record<string, string> = {
  RemoteWorkItemLink: FieldIcon.RemoteWorkItemLink,
  Link: FieldIcon.Link,
  Status: FieldIcon.Status,
  Assignee: FieldIcon.Assignee,
  "TA Approval Date": FieldIcon.TAApprovalDate,
  "TA Approval Status": FieldIcon.TAApprovalStatus,
  "TA Approver": FieldIcon.TAApprover,
  "TA Comment(s)": FieldIcon.TAComments,
  "DA Approval Date": FieldIcon.DAApprovalDate,
  "DA Approver": FieldIcon.DAApprover,
  "DA Approval Status": FieldIcon.DAApprovalStatus,
  "DA Comment(s)": FieldIcon.DAComments,
  "Design Approval": FieldIcon.DesignApproval,
  Description: FieldIcon.Description,
};
// Enum for all unique fieldDisplayName values to associate icons
export enum FieldTypeIcon {
  RemoteWorkItemLink = "RemoteWorkItemLink",
  Link = "Link",
  Status = "Status",
  Assignee = "Assignee",
  TAApprovalDate = "TA Approval Date",
  TAApprovalStatus = "TA Approval Status",
  TAApprover = "TA Approver",
  TAComments = "TA Comment(s)",
  DAApprovalDate = "DA Approval Date",
  DAApprover = "DA Approver",
  DAApprovalStatus = "DA Approval Status",
  DAComments = "DA Comment(s)",
  DesignApproval = "Design Approval",
  Description = "Description",
}
// removed misplaced gridApi and onGridReady
import { Component, OnInit, ViewChild } from "@angular/core";
// (removed misplaced @ViewChild)
import { ColDef, RowAutoHeightModule, ModuleRegistry } from "ag-grid-community";
// Register ag-grid modules
ModuleRegistry.registerModules([RowAutoHeightModule]);
import { Component as NgComponent, Input } from "@angular/core";
import { ActorCellRendererComponent } from "./actor-cell-renderer.component";
import { MultilineCellRenderer } from "./multiline-cell-renderer.component";
import { FieldIconCellRendererComponent } from "./field-icon-cell-renderer.component";
import { CommonModule } from "@angular/common";
import { AgGridModule } from "ag-grid-angular";
import {
  WIDGET_DATA_HISTORY_FAKE_DATA,
  WPO_16698,
} from "./widget-data-history.dummy-data";

@Component({
  selector: "app-widget-data-history",
  standalone: true,
  imports: [
    CommonModule,
    AgGridModule,
    ActorCellRendererComponent,
    MultilineCellRenderer,
    FieldIconCellRendererComponent,
  ],
  templateUrl: "./widget-data-history.component.html",
  styleUrls: ["./widget-data-history.component.scss"],
})
export class WidgetDataHistoryComponent implements OnInit {
  @ViewChild("agGrid") grid!: any;
  private gridApi: any;

  public datasets = [
    { label: "WPO_16698", value: WPO_16698 },
    { label: "Fake Data", value: WIDGET_DATA_HISTORY_FAKE_DATA },
  ];
  public selectedDataset = this.datasets[0];
  public fakeData = this.selectedDataset.value;

  public columnDefs: ColDef[] = [
    {
      width: 250,
      headerName: "Author",
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
        // If this is a group row and grouping by Author, just show the name (no circle)
        if (params.node?.group && params.colDef.field === params.node.field) {
          return undefined; // ag-grid will just show the value
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
    cellRendererParams: {
      suppressCount: false,
    },
  };

  ngOnInit(): void {
    // nothing needed
  }

  onDatasetChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idx = select.selectedIndex;
    this.selectedDataset = this.datasets[idx];
    this.fakeData = this.selectedDataset.value;
    setTimeout(() => {
      if (this.grid && this.grid.api) {
        this.grid.api.resetRowHeights();
      }
    }, 100);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    setTimeout(() => {
      this.gridApi.resetRowHeights();
    }, 200);
  }
}
