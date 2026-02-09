import { Routes } from "@angular/router";
import { GlobalSettingsComponent } from "./components/global-settings/global-settings.component";
import { WallManagerComponent } from "./components/wall-manager/wall-manager.component";

export const gardenRoomRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "settings",
        component: GlobalSettingsComponent,
      },
      {
        path: "walls",
        component: WallManagerComponent,
      },
      {
        path: "",
        redirectTo: "settings",
        pathMatch: "full",
      },
    ],
  },
];
