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
      import("./jira-sidebar-nav.component").then(
        (m) => m.JiraSidebarNavComponent,
      ),
  },
];
