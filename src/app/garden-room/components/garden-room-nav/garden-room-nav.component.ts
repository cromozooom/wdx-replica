import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { GardenRoomStore } from "../../store/garden-room.store";
import { MaterialOptimizationService } from "../../services/material-optimization.service";

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
export class GardenRoomNavComponent {
  readonly store = inject(GardenRoomStore);
  private readonly materialService = inject(MaterialOptimizationService);

  debugMode = signal(false);

  toggleDebugMode() {
    this.debugMode.update((value) => !value);
  }

  /**
   * Calculate front wall cost only (debug mode)
   */
  get frontWallCost(): { amount: number; currency: string } {
    const walls = this.store.walls();
    const frontWall = walls.find((w) => w.name === "Front");

    if (!frontWall || !frontWall.members || frontWall.members.length === 0) {
      return { amount: 0, currency: "GBP" };
    }

    // Generate cut requirements for front wall only
    const requirements = this.materialService.generateCutRequirements(
      frontWall.members,
    );
    const library = this.store.materialLibrary();
    const cutPlans = this.materialService.optimizeCutPlans(
      requirements,
      library,
    );
    const buyList = this.materialService.generateBuyList(cutPlans, library, [
      frontWall,
    ]);

    // Sum total
    const total = buyList.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
    const currency = buyList[0]?.currency || "GBP";

    return { amount: total, currency };
  }

  /**
   * Calculate total cost from buy list
   */
  get totalCost(): { amount: number; currency: string } {
    if (this.debugMode()) {
      return this.frontWallCost;
    }

    const buyList = this.store.buyList();
    if (buyList.length === 0) {
      return { amount: 0, currency: "GBP" };
    }

    // Group by currency and sum totals
    const totals = new Map<string, number>();
    buyList.forEach((item) => {
      if (item.totalPrice && item.currency) {
        const current = totals.get(item.currency) || 0;
        totals.set(item.currency, current + item.totalPrice);
      }
    });

    // Return the first currency total (assuming single currency)
    const [currency, amount] = totals.entries().next().value || ["GBP", 0];
    return { amount, currency };
  }
}
