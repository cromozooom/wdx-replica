import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

/**
 * GardenRoomNavComponent - Navigation for garden room feature
 */
@Component({
  selector: "app-garden-room-nav",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./garden-room-nav.component.html",
  styleUrls: ["./garden-room-nav.component.scss"],
})
export class GardenRoomNavComponent {}
