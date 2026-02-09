import { CutPlan } from "./cut-requirement.model";

/**
 * OutputBundle - aggregated outputs for user
 */
export interface OutputBundle {
  /** Buy list with timber and sheet materials */
  buyList: BuyListItem[];

  /** Optimized cut plans */
  cutList: CutPlan[];

  /** Hardware requirements */
  hardwareList: HardwareItem[];
}

/**
 * BuyListItem - item to purchase
 */
export interface BuyListItem {
  /** Type of item */
  itemType: "timber" | "sheet" | "insulation";

  /** Description of item */
  description: string;

  /** Quantity to buy */
  quantity: number;

  /** Unit of measurement */
  unit: string;

  /** Price per unit (optional) */
  pricePerUnit?: number;

  /** Total price for this item (optional) */
  totalPrice?: number;

  /** Currency code (optional) */
  currency?: string;
}

/**
 * HardwareItem - hardware to purchase
 */
export interface HardwareItem {
  /** Description of hardware */
  description: string;

  /** Quantity required */
  quantity: number;

  /** Unit of measurement */
  unit: string;
}
