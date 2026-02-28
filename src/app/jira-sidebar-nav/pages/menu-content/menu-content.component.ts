import { Component, OnInit, inject, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { MenuDataService } from "../../services/menu-data.service";
import { MenuItem } from "../../models/menu-item.interface";

/**
 * Component to display the content for a selected menu item.
 * Shows the title/label of the clicked menu item in the main content area.
 */
@Component({
  selector: "app-menu-content",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./menu-content.component.html",
  styleUrl: "./menu-content.component.scss",
})
export class MenuContentComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly menuDataService = inject(MenuDataService);
  private routeSubscription?: Subscription;

  menuItem: MenuItem | null = null;

  ngOnInit(): void {
    // Subscribe to route parameter changes (not snapshot)
    // This ensures the component updates when navigating between menu items
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const itemId = params.get("id");

      if (itemId) {
        // Find the menu item from the service
        const allItems = this.menuDataService.menuStructure();
        this.menuItem = allItems.itemsById.get(itemId) || null;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.routeSubscription?.unsubscribe();
  }
}
