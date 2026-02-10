import { Injectable } from "@angular/core";
import { CutRequirement, CutPlan } from "../models/cut-requirement.model";
import { MaterialLibrary } from "../models/material-library.model";
import { Member } from "../models/member.model";
import { BuyListItem, HardwareItem } from "../models/output-bundle.model";
import { HardwareRuleSet } from "../models/hardware-rule-set.model";

/**
 * MaterialOptimizationService - handles cut optimization and buy list generation
 * using First-Fit Decreasing bin packing algorithm
 */
@Injectable({
  providedIn: "root",
})
export class MaterialOptimizationService {
  /**
   * Generate cut requirements from wall members
   * @param members List of all members across all walls
   * @returns Aggregated cut requirements grouped by type, section, and length
   */
  generateCutRequirements(members: Member[]): CutRequirement[] {
    console.log("🎨 Generating cut requirements from members:", {
      memberCount: members.length,
      sampleMembers: members.slice(0, 3).map((m) => ({
        id: m.id,
        type: m.type,
        sectionName: m.sectionName,
        lengthMm: m.lengthMm,
      })),
      allSectionNames: [...new Set(members.map((m) => m.sectionName))],
    });

    // Group members by type, section, and length
    const requirementMap = new Map<string, CutRequirement>();

    members.forEach((member) => {
      // Use type, sectionName, and lengthMm for the key
      const sectionName = member.sectionName || "47x100-c24";
      const key = `${member.type}-${sectionName}-${member.lengthMm}`;

      if (member.type === "plate" || member.id?.includes("stud-0")) {
        console.log("🔍 Processing key member:", {
          memberId: member.id,
          memberType: member.type,
          originalSectionName: member.sectionName,
          finalSectionName: sectionName,
          lengthMm: member.lengthMm,
          generatedKey: key,
        });
      }

      if (requirementMap.has(key)) {
        // Increment quantity for existing requirement
        const existing = requirementMap.get(key)!;
        existing.quantity++;
      } else {
        // Create new requirement
        requirementMap.set(key, {
          id: key,
          memberType: member.type,
          lengthMm: member.lengthMm,
          sectionName: sectionName,
          quantity: 1,
        });
      }
    });

    // Convert to array and sort by length descending (for FFD algorithm)
    return Array.from(requirementMap.values()).sort(
      (a, b) => b.lengthMm - a.lengthMm,
    );
  }

  /**
   * Optimize cut plans using First-Fit Decreasing algorithm
   * @param requirements List of cut requirements
   * @param materials Material library with timber sections
   * @returns Optimized cut plans minimizing waste
   */
  optimizeCutPlans(
    requirements: CutRequirement[],
    materials: MaterialLibrary,
  ): CutPlan[] {
    // FFD: Requirements already sorted descending by generateCutRequirements
    const cutPlans: CutPlan[] = [];

    // Extract available lengths from timber sections
    const availableLengths = new Set<number>();
    materials.timberSections.forEach((section) => {
      section.lengthOptions.forEach((option) => {
        if (option.available) {
          availableLengths.add(option.lengthMm);
        }
      });
    });
    const stockLengths = Array.from(availableLengths).sort((a, b) => a - b); // Sort ascending

    // Process each requirement
    requirements.forEach((requirement) => {
      // Process each piece of this requirement
      for (let i = 0; i < requirement.quantity; i++) {
        // Try to fit into existing cut plans first
        let fitted = false;

        for (const plan of cutPlans) {
          const usedLength = plan.cuts.reduce(
            (sum, cut) => sum + cut.lengthMm * cut.quantity,
            0,
          );
          const remainingLength = plan.stockLengthMm - usedLength;

          if (remainingLength >= requirement.lengthMm) {
            // Fit this cut into existing plan
            const existingCut = plan.cuts.find((c) => c.id === requirement.id);

            if (existingCut) {
              existingCut.quantity++;
            } else {
              plan.cuts.push({
                id: requirement.id,
                memberType: requirement.memberType,
                lengthMm: requirement.lengthMm,
                sectionName: requirement.sectionName,
                quantity: 1,
              });
            }

            // Update waste
            plan.wasteMm = remainingLength - requirement.lengthMm;
            fitted = true;
            break;
          }
        }

        // If not fitted, create new plan with smallest stock that fits
        if (!fitted) {
          const suitableStock = stockLengths.find(
            (stock) => stock >= requirement.lengthMm,
          );

          if (!suitableStock) {
            console.warn(
              `No stock length available for cut: ${requirement.lengthMm}mm`,
            );
            continue;
          }

          cutPlans.push({
            stockLengthMm: suitableStock,
            cuts: [
              {
                id: requirement.id,
                memberType: requirement.memberType,
                lengthMm: requirement.lengthMm,
                sectionName: requirement.sectionName,
                quantity: 1,
              },
            ],
            wasteMm: suitableStock - requirement.lengthMm,
          });
        }
      }
    });

    return cutPlans;
  }

  /**
   * Generate buy list from cut plans
   * @param cutPlans Optimized cut plans
   * @param materials Material library
   * @param walls Wall configuration for insulation calculations
   * @returns Buy list with timber quantities and pricing
   */
  generateBuyList(
    cutPlans: CutPlan[],
    materials: MaterialLibrary,
    walls: any[] = [],
  ): BuyListItem[] {
    const buyList: BuyListItem[] = [];

    console.log("🌲 Starting timber calculations:", {
      cutPlansCount: cutPlans.length,
      wallsCount: walls.length,
      sampleCutPlan: cutPlans[0],
    });

    // Count stock lengths needed
    const stockCounts = new Map<number, number>();

    cutPlans.forEach((plan) => {
      const count = stockCounts.get(plan.stockLengthMm) || 0;
      stockCounts.set(plan.stockLengthMm, count + 1);
    });

    console.log("📊 Stock counts for timber:", {
      stockCountsMap: Array.from(stockCounts.entries()),
      totalPlans: cutPlans.length,
    });

    // Format as buy list items with pricing
    console.log("💰 Processing timber buy list items...");
    stockCounts.forEach((quantity, stockLength) => {
      console.log("📏 Processing stock length:", { stockLength, quantity });
      // Extract section name from first cut requirement for this stock length
      const cutPlansForThisLength = cutPlans.filter(
        (plan) => plan.stockLengthMm === stockLength,
      );
      const sectionName =
        cutPlansForThisLength[0]?.cuts[0]?.sectionName || "47x100-c24";

      console.log("🔍 Timber section lookup:", {
        stockLength,
        sectionName,
        cutPlansForLength: cutPlansForThisLength.length,
        sampleCuts: cutPlansForThisLength[0]?.cuts.slice(0, 3),
      });

      // Find the specific timber section and length option for this stock length
      let price = 0;
      let currency = "GBP";
      let description = `${stockLength}mm Timber`;

      // Look for the specific section that matches the requirement
      const targetSection = materials.timberSections.find(
        (section) => section.id === sectionName,
      );
      if (targetSection) {
        const lengthOption = targetSection.lengthOptions.find(
          (option) => option.lengthMm === stockLength && option.available,
        );
        if (lengthOption) {
          price = lengthOption.pricePerPiece;
          currency = lengthOption.currency;
          description = `${stockLength}mm ${targetSection.name}`;
        }
      }

      // Fallback: if specific section not found, use first available section
      if (price === 0) {
        for (const section of materials.timberSections) {
          const lengthOption = section.lengthOptions.find(
            (option) => option.lengthMm === stockLength && option.available,
          );
          if (lengthOption) {
            price = lengthOption.pricePerPiece;
            currency = lengthOption.currency;
            description = `${stockLength}mm ${section.name} (fallback)`;
            break;
          }
        }
      }

      console.log("✅ Adding timber to buy list:", {
        stockLength,
        sectionName,
        description,
        quantity,
        pricePerUnit: price,
        totalPrice: price * quantity,
        currency,
      });

      buyList.push({
        itemType: "timber",
        description,
        quantity,
        unit: "pieces",
        pricePerUnit: price,
        totalPrice: price * quantity,
        currency,
      });
    });

    console.log("🌲 Timber calculations complete:", {
      timberItemsAdded: buyList.length,
      totalTimberCost: buyList.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0,
      ),
    });

    // Add sheet materials based on wall selections
    const sheetRequirements = new Map<string, number>(); // sheetMaterialId -> total area (m²)

    // Add PIR insulation boards based on wall selections
    const pirRequirements = new Map<string, number>(); // pirBoardId -> total area (m²)

    walls.forEach((wall) => {
      // Calculate wall height based on wall name
      let wallHeightMm = 2200; // Default height
      if (wall.name === "Front") {
        // Use frontWallHeightMm if available from store context
        wallHeightMm = wall.heightMm || 2200;
      } else if (wall.name === "Back") {
        // Use backWallHeightMm if available from store context
        wallHeightMm = wall.heightMm || 2100;
      } else if (wall.name === "Base") {
        // Base wall uses heightMm as the width (left wall dimension)
        wallHeightMm = wall.heightMm || 3000;
      } else {
        // Side walls - use front wall height as default
        wallHeightMm = wall.heightMm || 2200;
      }

      const totalWallArea = (wall.lengthMm / 1000) * (wallHeightMm / 1000); // Convert to m²

      console.log(`📋 Processing wall ${wall.id} for materials:`, {
        name: wall.name,
        lengthMm: wall.lengthMm,
        heightMm: wallHeightMm,
        totalWallArea: totalWallArea.toFixed(4) + "m²",
        sheetMaterialId: wall.sheetMaterialId,
        pirBoardId: wall.pirBoardId,
        isBase: wall.name === "Base",
      });

      // Add to sheet requirements if sheet material is selected
      if (wall.sheetMaterialId) {
        let sheetArea = totalWallArea;

        // For walls with door openings, calculate net sheet area (subtract door opening)
        if (wall.hasDoorOpening && wall.name === "Front") {
          const doorSpaceWidthMm = wall.doorSpaceWidthMm || 2400;
          const doorOpeningArea =
            (doorSpaceWidthMm / 1000) * (wallHeightMm / 1000);
          sheetArea = totalWallArea - doorOpeningArea;

          console.log(`  📋 Door opening detected - adjusting sheet area:`, {
            totalWallArea: totalWallArea.toFixed(4) + "m²",
            doorOpeningArea: doorOpeningArea.toFixed(4) + "m²",
            netSheetArea: sheetArea.toFixed(4) + "m²",
          });
        }

        const existingSheetArea =
          sheetRequirements.get(wall.sheetMaterialId) || 0;
        sheetRequirements.set(
          wall.sheetMaterialId,
          existingSheetArea + sheetArea,
        );
        console.log(
          `  📋 Added ${sheetArea.toFixed(4)}m² sheet area for ${wall.sheetMaterialId}`,
        );
      }

      // Add to PIR requirements if PIR board is selected
      if (wall.pirBoardId) {
        console.log(`📐 Calculating PIR area for wall ${wall.id}:`, {
          totalWallArea: totalWallArea.toFixed(2) + "m²",
          pirBoardId: wall.pirBoardId,
          memberCount: wall.members.length,
          isBase: wall.name === "Base",
        });

        // Calculate structural member areas for insulation (net area)
        let structuralArea = 0;

        if (wall.name === "Base") {
          // Base wall: Calculate perimeter framing area only
          const perimeterLength = 2 * (wall.lengthMm + wallHeightMm); // Total perimeter
          const frameWidth = wall.studWidthMm || 47; // Use stud width as frame width
          structuralArea = (perimeterLength / 1000) * (frameWidth / 1000); // m²

          console.log(`  🟢 Base wall perimeter calculation:`, {
            perimeterLength: perimeterLength.toFixed(0) + "mm",
            frameWidth: frameWidth + "mm",
            structuralArea: structuralArea.toFixed(4) + "m²",
          });
        } else {
          // Regular wall: Calculate stud areas (vertical members) - ALL studs, not just "structural" ones
          const studs = wall.members.filter((m: any) => m.type === "stud");
          console.log(`  🏗️ Found ${studs.length} studs for PIR calculation`);

          studs.forEach((stud: any) => {
            // Use stud width from wall configuration
            const studWidthMm = wall.studWidthMm || 47;
            const studArea = (studWidthMm / 1000) * (stud.heightMm / 1000);
            structuralArea += studArea;
          });

          // Calculate plate areas (horizontal top and bottom)
          const topPlates = wall.members.filter(
            (m: any) =>
              m.type === "plate" && m.metadata?.["position"] === "top",
          );
          const bottomPlates = wall.members.filter(
            (m: any) =>
              m.type === "plate" && m.metadata?.["position"] === "bottom",
          );

          topPlates.forEach((plate: any) => {
            const plateArea =
              (plate.lengthMm / 1000) *
              ((wall.wallThicknessMm || 100) / 2 / 1000);
            structuralArea += plateArea;
          });

          bottomPlates.forEach((plate: any) => {
            const plateArea =
              (plate.lengthMm / 1000) *
              ((wall.wallThicknessMm || 100) / 2 / 1000);
            structuralArea += plateArea;
          });

          // Calculate noggin areas (horizontal bracing)
          const noggins = wall.members.filter((m: any) => m.type === "noggin");
          noggins.forEach((noggin: any) => {
            // Use stud width for noggin width (same material)
            const nogginWidthMm = wall.studWidthMm || 47;
            const nogginArea =
              (noggin.lengthMm / 1000) * (nogginWidthMm / 1000);
            structuralArea += nogginArea;
          });
        }

        // Calculate net insulation area (total wall area minus structural areas)
        const insulationArea = Math.max(0, totalWallArea - structuralArea);

        if (wall.name === "Base") {
          console.log(`  📊 Base PIR calculation results:`, {
            totalWallArea: totalWallArea.toFixed(4) + "m²",
            structuralArea: structuralArea.toFixed(4) + "m²",
            insulationArea: insulationArea.toFixed(4) + "m²",
            type: "perimeter frame",
          });
        } else {
          // Log results for regular walls with member counts
          const studs = wall.members.filter((m: any) => m.type === "stud");
          const topPlates = wall.members.filter(
            (m: any) =>
              m.type === "plate" && m.metadata?.["position"] === "top",
          );
          const bottomPlates = wall.members.filter(
            (m: any) =>
              m.type === "plate" && m.metadata?.["position"] === "bottom",
          );
          const noggins = wall.members.filter((m: any) => m.type === "noggin");

          console.log(`  📊 PIR calculation results:`, {
            totalWallArea: totalWallArea.toFixed(4) + "m²",
            structuralArea: structuralArea.toFixed(4) + "m²",
            insulationArea: insulationArea.toFixed(4) + "m²",
            studCount: studs.length,
            plateCount: topPlates.length + bottomPlates.length,
            nogginCount: noggins.length,
          });
        }

        if (insulationArea > 0) {
          const existingArea = pirRequirements.get(wall.pirBoardId) || 0;
          pirRequirements.set(wall.pirBoardId, existingArea + insulationArea);
          console.log(
            `  ✅ Added ${insulationArea.toFixed(4)}m² PIR area for ${wall.pirBoardId}`,
          );
        } else {
          console.log(
            `  ⚠️ No PIR area calculated (insulationArea = ${insulationArea})`,
          );
        }
      }
    });

    // Convert sheet area requirements to sheet quantities
    console.log(
      `\n🔍 Converting sheet requirements to buy list:`,
      sheetRequirements,
    );
    sheetRequirements.forEach((totalAreaM2, sheetMaterialId) => {
      const sheetMaterial = materials.sheetMaterials.find(
        (sheet) => sheet.id === sheetMaterialId,
      );
      console.log(`  📋 Processing sheet ${sheetMaterialId}:`, {
        totalAreaM2: totalAreaM2.toFixed(4),
        sheetMaterialFound: !!sheetMaterial,
        sheetMaterial: sheetMaterial
          ? {
              name: sheetMaterial.name,
              dimensions: `${sheetMaterial.widthMm}x${sheetMaterial.heightMm}x${sheetMaterial.thicknessMm}mm`,
              pricePerSheet: sheetMaterial.pricePerSheet,
            }
          : null,
      });

      if (sheetMaterial) {
        // Calculate sheet area in m²
        const sheetAreaM2 =
          (sheetMaterial.widthMm / 1000) * (sheetMaterial.heightMm / 1000);

        // Calculate number of sheets needed (round up)
        const sheetsNeeded = Math.ceil(totalAreaM2 / sheetAreaM2);

        console.log(`    📊 Sheet calculation:`, {
          sheetAreaM2: sheetAreaM2.toFixed(4),
          sheetsNeeded: sheetsNeeded,
        });

        buyList.push({
          itemType: "sheet",
          description: `${sheetMaterial.name} (${sheetMaterial.widthMm}x${sheetMaterial.heightMm}x${sheetMaterial.thicknessMm}mm)`,
          quantity: sheetsNeeded,
          unit: "sheets",
          pricePerUnit: sheetMaterial.pricePerSheet,
          totalPrice: sheetMaterial.pricePerSheet * sheetsNeeded,
          currency: sheetMaterial.currency,
        });

        console.log(`    ✅ Added ${sheetsNeeded} sheets to buy list`);
      }
    });

    // Convert PIR area requirements to board quantities
    console.log(
      `\n🔍 Converting PIR requirements to buy list:`,
      pirRequirements,
    );
    pirRequirements.forEach((totalAreaM2, pirBoardId) => {
      const pirBoard = materials.pirBoards.find(
        (board) => board.id === pirBoardId,
      );
      console.log(`  🧊 Processing PIR ${pirBoardId}:`, {
        totalAreaM2: totalAreaM2.toFixed(4),
        pirBoardFound: !!pirBoard,
        pirBoard: pirBoard
          ? {
              name: pirBoard.name,
              dimensions: `${pirBoard.widthMm}x${pirBoard.heightMm}x${pirBoard.thicknessMm}mm`,
              pricePerBoard: pirBoard.pricePerBoard,
            }
          : null,
      });

      if (pirBoard) {
        // Calculate board area in m²
        const boardAreaM2 =
          (pirBoard.widthMm / 1000) * (pirBoard.heightMm / 1000);

        // Calculate number of boards needed (round up)
        const boardsNeeded = Math.ceil(totalAreaM2 / boardAreaM2);

        console.log(`    📊 PIR calculation:`, {
          boardAreaM2: boardAreaM2.toFixed(4),
          boardsNeeded: boardsNeeded,
        });

        buyList.push({
          itemType: "insulation",
          description: `${pirBoard.name} - ${pirBoard.thicknessMm}mm (${pirBoard.widthMm}x${pirBoard.heightMm}mm)`,
          quantity: boardsNeeded,
          unit: "boards",
          pricePerUnit: pirBoard.pricePerBoard,
          totalPrice: pirBoard.pricePerBoard * boardsNeeded,
          currency: pirBoard.currency,
        });

        console.log(`    ✅ Added ${boardsNeeded} boards to buy list`);
      }
    });

    return buyList.sort((a, b) => a.description.localeCompare(b.description));
  }

  /**
   * Calculate hardware requirements
   * @param members List of all members
   * @param rules Hardware calculation rules
   * @returns Hardware items with quantities
   */
  calculateHardware(members: Member[], rules: HardwareRuleSet): HardwareItem[] {
    const hardwareList: HardwareItem[] = [];

    // Calculate total linear meters for screws
    const totalLinearMeters =
      members.reduce((sum, member) => sum + member.lengthMm, 0) / 1000;

    const screwsNeeded = Math.ceil(
      totalLinearMeters * rules.screwsPerLinearMeter,
    );

    hardwareList.push({
      description: "Wood Screws (50mm)",
      quantity: screwsNeeded,
      unit: "pieces",
    });

    // Calculate total square meters for tape and membrane
    // Simplified: assume standard wall width of 100mm for studs
    const totalSquareMeters = totalLinearMeters * 0.1; // 100mm = 0.1m width

    const tapeNeeded = Math.ceil(totalSquareMeters * rules.tapePerSquareMeter);

    hardwareList.push({
      description: "Breather Tape",
      quantity: tapeNeeded,
      unit: "linear meters",
    });

    const membraneNeeded = Math.ceil(
      totalSquareMeters * rules.membranePerSquareMeter,
    );

    hardwareList.push({
      description: "Breather Membrane",
      quantity: membraneNeeded,
      unit: "square meters",
    });

    return hardwareList;
  }

  /**
   * Calculate waste percentage for a cut plan
   * @param plan Cut plan to analyze
   * @returns Waste percentage (0-100)
   */
  calculateWastePercentage(plan: CutPlan): number {
    const totalCutLength = plan.cuts.reduce(
      (sum, cut) => sum + cut.lengthMm * cut.quantity,
      0,
    );
    return (plan.wasteMm / plan.stockLengthMm) * 100;
  }
}
