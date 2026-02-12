import { Routes } from "@angular/router";
import { AgGridDemoComponent } from "./ag-grid-demo.component";

/**
 * Route configuration for the ag-Grid with ng-select demonstration feature.
 * Exports routes array as default for lazy-loading.
 */
export default [
  {
    path: "",
    component: AgGridDemoComponent,
  },
] as Routes;
