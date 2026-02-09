import { Routes } from "@angular/router";
import { GlobalSettingsComponent } from "./components/global-settings/global-settings.component";

export const gardenRoomRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "settings",
        component: GlobalSettingsComponent,
      },
      {
        path: "",
        redirectTo: "settings",
        pathMatch: "full",
      },
    ],
  },
];
