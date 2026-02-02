import { Routes } from "@angular/router";

export const CONFIGURATION_MANAGER_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./configuration-manager.component").then(
        (m) => m.ConfigurationManagerComponent,
      ),
  },
];
