import { Routes } from "@angular/router";

export const SPX_MAGIC_SELECTOR_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./spx-magic-selector-demo.component").then(
        (m) => m.SpxMagicSelectorDemoComponent,
      ),
  },
];
