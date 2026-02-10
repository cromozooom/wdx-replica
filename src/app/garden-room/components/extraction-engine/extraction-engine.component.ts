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
   * Organize timber by wall and member type for construction planning
   */
  get timberOrganization(): any[] {
    const walls = this.store.walls();
    return walls.map((wall) => {
      const members = wall.members || [];

      // Group members by type
      const memberGroups = {
        topPlate: members.filter(
          (m) => m.type === "plate" && m.metadata?.["position"] === "top",
        ),
        bottomPlate: members.filter(
          (m) => m.type === "plate" && m.metadata?.["position"] === "bottom",
        ),
        studs: members.filter((m) => m.type === "stud"),
        noggins: members.filter((m) => m.type === "noggin"),
      };

      return {
        wallName: wall.name || wall.id,
        wallId: wall.id,
        timberSection: wall.timberSection || "47x100-c24",
        lengthMm: wall.lengthMm,
        memberGroups,
        totalMembers: members.length,
      };
    });
  }

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
   * Analyze waste patterns and suggest reuse opportunities
   */
  get wasteAnalysis(): {
    totalWasteMm: number;
    wasteByLength: Map<number, number>;
    reusableWaste: Array<{
      lengthMm: number;
      quantity: number;
      possibleUses: string[];
    }>;
    totalWasteValue: number;
  } {
    const cutPlans = this.cutList();
    const wasteByLength = new Map<number, number>();
    let totalWasteMm = 0;
    let totalWasteValue = 0;

    // Analyze waste patterns
    cutPlans.forEach((plan) => {
      if (plan.wasteMm > 0) {
        totalWasteMm += plan.wasteMm;
        const count = wasteByLength.get(plan.wasteMm) || 0;
        wasteByLength.set(plan.wasteMm, count + 1);

        // Estimate waste value (rough calculation)
        const stockLengthCostPerMm = this.estimateStockCostPerMm(
          plan.stockLengthMm,
        );
        totalWasteValue += plan.wasteMm * stockLengthCostPerMm;
      }
    });

    // Identify reusable waste pieces
    const reusableWaste = Array.from(wasteByLength.entries())
      .map(([lengthMm, quantity]) => ({
        lengthMm,
        quantity,
        possibleUses: this.suggestWasteUses(lengthMm),
      }))
      .filter((item) => item.possibleUses.length > 0)
      .sort((a, b) => b.lengthMm - a.lengthMm);

    return {
      totalWasteMm,
      wasteByLength,
      reusableWaste,
      totalWasteValue,
    };
  }

  /**
   * Suggest possible uses for waste pieces
   */
  private suggestWasteUses(lengthMm: number): string[] {
    const uses: string[] = [];

    if (lengthMm >= 600) {
      uses.push("Blocking/Packers");
    }
    if (lengthMm >= 400) {
      uses.push("Short noggins");
      uses.push("Bracing pieces");
    }
    if (lengthMm >= 300) {
      uses.push("Cleats/Battens");
    }
    if (lengthMm >= 200) {
      uses.push("Wedges/Shims");
    }
    if (lengthMm >= 100) {
      uses.push("Fire blocks");
    }

    return uses;
  }

  /**
   * Estimate cost per mm for stock length
   */
  private estimateStockCostPerMm(stockLengthMm: number): number {
    const buyList = this.buyList();
    const timberItem = buyList.find(
      (item) =>
        item.itemType === "timber" &&
        item.description.includes(`${stockLengthMm}mm`),
    );

    if (timberItem?.pricePerUnit) {
      return timberItem.pricePerUnit / stockLengthMm;
    }

    // Fallback estimate
    return 0.002; // £0.002 per mm
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
        wallThicknessMm: wall.wallThicknessMm,
        timberSection: wall.timberSection,
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

  /**
   * Parse cut ID to extract wall and member information
   * Actual format: "memberType-sectionName-lengthMm" (e.g., "plate-47x100-c24-5000")
   */
  parseCutId(cutId: string): {
    wallId: string;
    wallName: string;
    memberDescription: string;
  } {
    const parts = cutId.split("-");

    if (parts.length >= 1) {
      const memberType = parts[0]; // "plate", "stud", "noggin"
      const lengthMm = parts[parts.length - 1]; // Last part is length

      // Find the wall that has this member type and length
      const walls = this.store.walls();
      let wallInfo = { wallId: "unknown", wallName: "Unknown Wall" };

      for (const wall of walls) {
        const members = wall.members || [];
        const matchingMember = members.find(
          (m) => m.type === memberType && m.lengthMm.toString() === lengthMm,
        );

        if (matchingMember) {
          wallInfo = {
            wallId: wall.id,
            wallName: this.getWallDisplayName(wall.id),
          };
          break;
        }
      }

      // Parse member description
      let memberDescription = "Unknown";

      switch (memberType) {
        case "plate":
          // Check if we can determine plate position from wall data
          const wall = walls.find((w) => w.id === wallInfo.wallId);
          if (wall?.members) {
            const plateMembers = wall.members.filter(
              (m) => m.type === "plate" && m.lengthMm.toString() === lengthMm,
            );
            if (plateMembers.length > 0) {
              const plateMember = plateMembers[0];
              if (plateMember.metadata && plateMember.metadata["position"]) {
                memberDescription =
                  plateMember.metadata["position"] === "top"
                    ? "Top Plate"
                    : "Bottom Plate";
              } else {
                memberDescription = "Plate";
              }
            } else {
              memberDescription = "Plate";
            }
          } else {
            memberDescription = "Plate";
          }
          break;
        case "stud":
          memberDescription = "Stud";
          break;
        case "noggin":
          memberDescription = "Noggin";
          break;
        default:
          memberDescription =
            memberType.charAt(0).toUpperCase() + memberType.slice(1);
      }

      return {
        wallId: wallInfo.wallId,
        wallName: wallInfo.wallName,
        memberDescription,
      };
    }

    return {
      wallId: "unknown",
      wallName: "Unknown Wall",
      memberDescription: "Unknown Member",
    };
  }

  /**
   * Get display name for wall ID
   */
  getWallDisplayName(wallId: string): string {
    const displayNames: Record<string, string> = {
      front: "Front Wall",
      back: "Back Wall",
      left: "Left Wall",
      right: "Right Wall",
      base: "Base Wall",
      roof: "Roof Wall",
    };

    return displayNames[wallId.toLowerCase()] || `${wallId} Wall`;
  }

  /**
   * Get enhanced cut information with wall details
   */
  getEnhancedCutInfo(cut: any): any {
    const parsedInfo = this.parseCutId(cut.id);
    return {
      ...cut,
      wallId: parsedInfo.wallId,
      wallName: parsedInfo.wallName,
      memberDescription: parsedInfo.memberDescription,
      fullDescription: `${parsedInfo.wallName} - ${parsedInfo.memberDescription}`,
    };
  }
}
