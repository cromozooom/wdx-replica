/**
 * Lazy-loaded routes for jira-sidebar-nav feature module.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/plan.md for route configuration
 */
import { Routes } from "@angular/router";

export const JIRA_SIDEBAR_NAV_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./jira-sidebar-nav.component.js").then(
        (m) => m.JiraSidebarNavComponent,
      ),
    children: [
      {
        path: "item/:id",
        loadComponent: () =>
          import("./pages/menu-content/menu-content.component.js").then(
            (m) => m.MenuContentComponent,
          ),
      },
      {
        path: "",
        redirectTo: "item/1",
        pathMatch: "full",
      },
    ],
  },
];
