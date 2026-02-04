import { Injectable, inject } from "@angular/core";
import {
  Basket,
  BASKET_COLORS,
  CORE_BASKET_COLOR,
} from "../models/basket.model";
import { BasketStorageService } from "./basket-storage.service";
import { TeamMemberService } from "./team-member.service";

@Injectable({
  providedIn: "root",
})
export class BasketService {
  private storage = inject(BasketStorageService);
  private teamMemberService = inject(TeamMemberService);

  async getAll(): Promise<Basket[]> {
    return this.storage.getAll();
  }

  async getById(id: number): Promise<Basket | undefined> {
    return this.storage.getById(id);
  }

  async create(name: string): Promise<Basket> {
    const id = await this.storage.getNextId();
    const currentUser = this.teamMemberService.getCurrentUser();
    const now = new Date();

    // Assign color based on basket name or available colors
    let color: string;
    if (name === "Product (core)") {
      color = CORE_BASKET_COLOR;
    } else {
      const existingBaskets = await this.getAll();
      const usedColors = new Set(
        existingBaskets
          .map((b) => b.color)
          .filter((c) => c !== CORE_BASKET_COLOR),
      );
      // Find first available color from palette
      color = BASKET_COLORS.find((c) => !usedColors.has(c)) || BASKET_COLORS[0];
    }

    const basket: Basket = {
      id,
      name,
      color,
      configurationIds: [],
      createdDate: now,
      createdBy: currentUser,
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
    };

    await this.storage.save(basket);
    return basket;
  }

  async update(id: number, updates: Partial<Basket>): Promise<Basket> {
    const existing = await this.storage.getById(id);
    if (!existing) {
      throw new Error(`Basket with ID ${id} not found`);
    }

    const currentUser = this.teamMemberService.getCurrentUser();
    const now = new Date();

    const updated: Basket = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
    };

    await this.storage.save(updated);
    return updated;
  }

  async delete(id: number): Promise<void> {
    return this.storage.delete(id);
  }

  async addConfiguration(
    basketId: number,
    configurationId: number,
  ): Promise<Basket> {
    const basket = await this.getById(basketId);
    if (!basket) {
      throw new Error(`Basket with ID ${basketId} not found`);
    }

    if (!basket.configurationIds.includes(configurationId)) {
      basket.configurationIds.push(configurationId);
      return this.update(basketId, {
        configurationIds: basket.configurationIds,
      });
    }

    return basket;
  }

  async removeConfiguration(
    basketId: number,
    configurationId: number,
  ): Promise<Basket> {
    const basket = await this.getById(basketId);
    if (!basket) {
      throw new Error(`Basket with ID ${basketId} not found`);
    }

    basket.configurationIds = basket.configurationIds.filter(
      (id) => id !== configurationId,
    );
    return this.update(basketId, { configurationIds: basket.configurationIds });
  }

  async addMultipleConfigurations(
    basketId: number,
    configurationIds: number[],
  ): Promise<Basket> {
    const basket = await this.getById(basketId);
    if (!basket) {
      throw new Error(`Basket with ID ${basketId} not found`);
    }

    const uniqueIds = new Set([
      ...basket.configurationIds,
      ...configurationIds,
    ]);
    return this.update(basketId, { configurationIds: Array.from(uniqueIds) });
  }

  async initializeDefaultBasket(): Promise<Basket> {
    const baskets = await this.getAll();
    const productBasket = baskets.find((b) => b.name === "Product (core)");

    if (productBasket) {
      return productBasket;
    }

    return this.create("Product (core)");
  }
}
