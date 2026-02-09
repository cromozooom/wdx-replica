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
   * @returns Aggregated cut requirements
   */
  generateCutRequirements(members: Member[]): CutRequirement[] {
    // Group members by type and length
    const requirementMap = new Map<string, CutRequirement>();

    members.forEach((member) => {
      // Use lengthMm for all member types (studs, plates, noggins)
      const key = `${member.type}-${member.lengthMm}`;

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
   * @param materials Material library with stock lengths
   * @returns Optimized cut plans minimizing waste
   */
  optimizeCutPlans(
    requirements: CutRequirement[],
    materials: MaterialLibrary,
  ): CutPlan[] {
    // FFD: Requirements already sorted descending by generateCutRequirements
    const cutPlans: CutPlan[] = [];
    const stockLengths = [...materials.stockLengthsMm].sort((a, b) => a - b); // Sort ascending

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
   * @returns Buy list with timber quantities
   */
  generateBuyList(
    cutPlans: CutPlan[],
    materials: MaterialLibrary,
  ): BuyListItem[] {
    const buyList: BuyListItem[] = [];

    // Count stock lengths needed
    const stockCounts = new Map<number, number>();

    cutPlans.forEach((plan) => {
      const count = stockCounts.get(plan.stockLengthMm) || 0;
      stockCounts.set(plan.stockLengthMm, count + 1);
    });

    // Format as buy list items
    stockCounts.forEach((quantity, stockLength) => {
      buyList.push({
        itemType: "timber",
        description: `${stockLength}mm Timber`,
        quantity,
        unit: "pieces",
      });
    });

    // Add sheet materials if present
    materials.sheetMaterials.forEach((sheet) => {
      // NOTE: Sheet count calculation is simplified here
      // In real implementation, would need actual area requirements
      buyList.push({
        itemType: "sheet",
        description: sheet.name,
        quantity: 0, // Placeholder - calculated separately
        unit: "sheets",
      });
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
