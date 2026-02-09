import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { GardenRoomNavComponent } from "../components/garden-room-nav/garden-room-nav.component";

/**
 * GardenRoomLayoutComponent - Layout wrapper with navigation
 */
@Component({
  selector: "app-garden-room-layout",
  standalone: true,
  imports: [CommonModule, RouterModule, GardenRoomNavComponent],
  template: `
    <div class="garden-room-layout">
      <app-garden-room-nav></app-garden-room-nav>
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .garden-room-layout {
        min-height: 100vh;
        background: #f5f7fa;
      }

      .content-area {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1.5rem 2rem;
      }
    `,
  ],
})
export class GardenRoomLayoutComponent {}
