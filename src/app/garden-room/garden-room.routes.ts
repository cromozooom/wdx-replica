import { Routes } from "@angular/router";
import { GardenRoomLayoutComponent } from "./garden-room-layout.component";
import { GlobalSettingsComponent } from "./components/global-settings/global-settings.component";
import { WallManagerComponent } from "./components/wall-manager/wall-manager.component";
import { ExtractionEngineComponent } from "./components/extraction-engine/extraction-engine.component";

export const gardenRoomRoutes: Routes = [
  {
    path: "",
    component: GardenRoomLayoutComponent,
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
        path: "materials",
        component: ExtractionEngineComponent,
      },
      {
        path: "",
        redirectTo: "settings",
        pathMatch: "full",
      },
    ],
  },
];
