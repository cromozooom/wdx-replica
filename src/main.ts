import { ValidationModule } from "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { ClientSideRowModelModule } from "ag-grid-community";
import { PaginationModule } from "ag-grid-community";
import { RowGroupingModule } from "ag-grid-enterprise";
import { SetFilterModule } from "ag-grid-enterprise";
import { MenuModule } from "ag-grid-enterprise";
import { ColumnsToolPanelModule } from "ag-grid-enterprise";
import { MultiFilterModule } from "ag-grid-enterprise";
import { AgGridModule } from "ag-grid-angular";

// Register required ag-Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule,
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

// Configure Monaco Editor environment for web workers
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (moduleId: string, label: string) {
    if (label === "json") {
      return "./assets/monaco-editor/esm/vs/language/json/json.worker.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./assets/monaco-editor/esm/vs/language/css/css.worker.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./assets/monaco-editor/esm/vs/language/html/html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./assets/monaco-editor/esm/vs/language/typescript/ts.worker.js";
    }
    return "./assets/monaco-editor/esm/vs/editor/editor.worker.js";
  },
};

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
