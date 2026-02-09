import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { GardenRoomNavComponent } from "./components/garden-room-nav/garden-room-nav.component";

/**
 * GardenRoomLayoutComponent - Layout wrapper with navigation
 */
@Component({
  selector: "app-garden-room-layout",
  standalone: true,
  imports: [CommonModule, RouterModule, GardenRoomNavComponent],
  template: `
    <div class="d-flex w-100 h-100 d-flex overflow-hidden">
      <app-garden-room-nav></app-garden-room-nav>
      <div class="flex-grow-1 w-100 overflow-hidden d-flex">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [],
})
export class GardenRoomLayoutComponent {}
