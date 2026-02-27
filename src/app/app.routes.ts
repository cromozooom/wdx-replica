import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard/dashboard.component";

export const routes: Routes = [
  {
    path: "dashboard",
    children: [
      {
        path: "",
        component: DashboardComponent,
      },
      {
        path: ":type",
        component: DashboardComponent,
      },
      {
        path: "widget-form-history",
        component: DashboardComponent,
        data: { type: "widget-form-history" },
      },
    ],
  },
  {
    path: "configuration-manager",
    loadChildren: () =>
      import("./configuration-manager/configuration-manager.routes").then(
        (m) => m.CONFIGURATION_MANAGER_ROUTES,
      ),
  },
  {
    path: "garden-room",
    loadChildren: () =>
      import("./garden-room/garden-room.routes").then(
        (m) => m.gardenRoomRoutes,
      ),
  },
  {
    path: "ag-grid-demo",
    loadChildren: () => import("./ag-grid-demo/ag-grid-demo.routes"),
  },
  {
    path: "magic-selector",
    loadChildren: () =>
      import("./spx-magic-selector/spx-magic-selector.routes").then(
        (m) => m.SPX_MAGIC_SELECTOR_ROUTES,
      ),
  },
  {
    path: "jira-sidebar-nav",
    loadChildren: () =>
      import("./jira-sidebar-nav/jira-sidebar-nav.routes").then(
        (m) => m.JIRA_SIDEBAR_NAV_ROUTES,
      ),
  },
  {
    path: "menu-demo",
    loadChildren: () =>
      import("./jira-sidebar-nav/jira-sidebar-nav.routes").then(
        (m) => m.JIRA_SIDEBAR_NAV_ROUTES,
      ),
  },
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
];
