/**
 * Template Assistant feature routes.
 * Lazy-loaded feature module for template editor.
 */

import { Routes } from "@angular/router";

export const TEMPLATE_ASSISTANT_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./template-assistant.component").then(
        (m) => m.TemplateAssistantComponent,
      ),
  },
];
