import { ValidationModule } from "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { ClientSideRowModelModule } from "ag-grid-community";
import { RowGroupingModule } from "ag-grid-enterprise";
import { SetFilterModule } from "ag-grid-enterprise";
import { MenuModule } from "ag-grid-enterprise";
import { ColumnsToolPanelModule } from "ag-grid-enterprise";
import { MultiFilterModule } from "ag-grid-enterprise";
import { AgGridModule } from "ag-grid-angular";

// Register required ag-Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowGroupingModule,
  SetFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  MultiFilterModule,
  ValidationModule,
]);
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
