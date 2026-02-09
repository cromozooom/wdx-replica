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
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
];
