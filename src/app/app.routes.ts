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
    ],
  },
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
];
