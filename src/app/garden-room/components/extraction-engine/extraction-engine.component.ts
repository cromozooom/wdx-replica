import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GardenRoomStore } from "../../store/garden-room.store";

/**
 * ExtractionEngineComponent - Display buy, cut, and hardware lists
 * Shows optimized material ordering and cutting guidance
 */
@Component({
  selector: "app-extraction-engine",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./extraction-engine.component.html",
  styleUrls: ["./extraction-engine.component.scss"],
})
export class ExtractionEngineComponent {
  readonly store = inject(GardenRoomStore);

  // Expose signals as component properties for template
  readonly buyList = this.store.buyList;
  readonly cutList = this.store.cutList;
  readonly hardwareList = this.store.hardwareList;
  readonly totalWasteMm = this.store.totalWasteMm;
  readonly totalMemberCount = this.store.totalMemberCount;

  /**
   * Calculate total cost of all items in buy list
   */
  get totalCost(): { amount: number; currency: string } {
    const buyList = this.buyList();
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

  /**
   * Trigger print dialog
   */
  printCutList() {
    window.print();
  }

  /**
   * Debug material analysis - log wall configurations and material selections
   */
  logWallAnalysis() {
    console.log("🔍 === MATERIAL ANALYSIS DEBUG ===");
    console.log("📅 Timestamp:", new Date().toLocaleTimeString());

    const walls = this.store.walls();
    console.log("🏠 Total walls:", walls.length);

    walls.forEach((wall, index) => {
      console.log(`\n📋 Wall ${index + 1}: ${wall.name} (${wall.id})`);
      console.log("  📏 Dimensions:", {
        lengthMm: wall.lengthMm,
        heightMm:
          wall.name === "Front"
            ? this.store.frontWallHeightMm()
            : wall.name === "Back"
              ? this.store.backWallHeightMm()
              : this.store.frontWallHeightMm(),
      });
      console.log("  🔧 Structure:", {
        studGapMm: wall.studGapMm,
        studWidthMm: wall.studWidthMm,
        plateThicknessTopMm: wall.plateThicknessTopMm,
        plateThicknessBottomMm: wall.plateThicknessBottomMm,
        hasNoggins: wall.hasNoggins,
      });
      console.log("  🚪 Door config:", {
        hasDoorOpening: wall.hasDoorOpening,
        pillarWidthMm: wall.pillarWidthMm,
        leftWallWidthMm: wall.leftWallWidthMm,
        doorSpaceWidthMm: wall.doorSpaceWidthMm,
      });
      console.log("  🧱 Materials:", {
        pirBoardId: wall.pirBoardId || "NOT SET",
        sheetMaterialId: wall.sheetMaterialId || "NOT SET",
      });
      console.log("  👥 Members:", {
        total: wall.members?.length || 0,
        studs: wall.members?.filter((m) => m.type === "stud").length || 0,
        plates: wall.members?.filter((m) => m.type === "plate").length || 0,
        noggins: wall.members?.filter((m) => m.type === "noggin").length || 0,
      });

      // Check if materials are properly selected
      const hasValidPir = wall.pirBoardId && wall.pirBoardId !== "";
      const hasValidSheet = wall.sheetMaterialId && wall.sheetMaterialId !== "";

      if (!hasValidPir || !hasValidSheet) {
        console.log("  ⚠️  MISSING MATERIALS:", {
          pirMissing: !hasValidPir,
          sheetMissing: !hasValidSheet,
        });
      } else {
        console.log("  ✅ Materials properly selected");
      }
    });

    // Log buy list status
    console.log("\n🛒 BUY LIST ANALYSIS:");
    const buyList = this.store.buyList();
    console.log("  📦 Total items:", buyList.length);

    const timberItems = buyList.filter((item) => item.itemType === "timber");
    const pirItems = buyList.filter((item) => item.itemType === "insulation");
    const sheetItems = buyList.filter((item) => item.itemType === "sheet");

    console.log("  🌲 Timber items:", timberItems.length);
    console.log("  🧊 PIR/Insulation items:", pirItems.length);
    console.log("  📋 Sheet items:", sheetItems.length);

    if (pirItems.length === 0) {
      console.log("  ❌ NO PIR ITEMS FOUND - Check wall.pirBoardId values");
    }
    if (sheetItems.length === 0) {
      console.log(
        "  ❌ NO SHEET ITEMS FOUND - Check wall.sheetMaterialId values",
      );
    }

    // Log individual buy list items
    buyList.forEach((item, index) => {
      console.log(
        `    ${index + 1}. ${item.itemType}: ${item.description} (qty: ${item.quantity})`,
      );
    });

    console.log("\n🔍 === END ANALYSIS ===");
  }
}
