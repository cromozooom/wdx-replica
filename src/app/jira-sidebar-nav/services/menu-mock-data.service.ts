import { Injectable } from "@angular/core";
import { MenuItem } from "../models";

/**
 * Mock data service providing default menu structure.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * Provides default 3-level menu structure per T013:
 * - Dashboard > Analytics/Reports
 * - Projects > Active/Archived
 * - Settings
 *
 * @see specs/001-jira-sidebar-nav/tasks.md Task T013
 */
@Injectable({
  providedIn: "root",
})
export class MenuMockDataService {
  /**
   * Get default menu structure (wealth management navigation).
   * Level 1 only menu items based on wealth management field requirements.
   */
  getDefaultMenuStructure(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Overview",
        icon: "fas fa-house",
        routerLink: "/wealth/overview",
        order: 0,
        contentConfig: {
          componentType: "dashboard",
          settings: {
            dashboardType: "overview",
          },
        },
      },
      {
        id: "2",
        label: "Bulk And Breaches",
        icon: "fas fa-bullseye-pointer",
        routerLink: "/wealth/bulk-and-breaches",
        order: 1,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "bulkAndBreaches",
          },
        },
      },
      {
        id: "3",
        label: "Contacts",
        icon: "fas fa-address-card",
        routerLink: "/wealth/contacts",
        order: 2,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "contacts",
          },
        },
      },
      {
        id: "4",
        label: "Prospects",
        icon: "fas fa-magnifying-glass",
        routerLink: "/wealth/prospects",
        order: 3,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "prospects",
          },
        },
      },
      {
        id: "5",
        label: "Opportunities",
        icon: "fas fa-lightbulb",
        routerLink: "/wealth/opportunities",
        order: 4,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "opportunities",
          },
        },
      },
      {
        id: "6",
        label: "Advisers",
        icon: "fas fa-link",
        routerLink: "/wealth/advisers",
        order: 5,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "advisers",
          },
        },
      },
      {
        id: "7",
        label: "Intermediaries",
        icon: "fas fa-building",
        routerLink: "/wealth/intermediaries",
        order: 6,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "intermediaries",
          },
        },
      },
      {
        id: "8",
        label: "Families",
        icon: "fas fa-users",
        routerLink: "/wealth/families",
        order: 7,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "families",
          },
        },
      },
      {
        id: "9",
        label: "Suitability Reviews",
        icon: "fas fa-search-dollar",
        routerLink: "/wealth/suitability-reviews",
        order: 8,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "suitabilityReviews",
          },
        },
      },
      {
        id: "10",
        label: "Marketing Lists",
        icon: "fas fa-list",
        routerLink: "/wealth/marketing-lists",
        order: 9,
        expanded: false,
        children: [
          {
            id: "10-1",
            label: "All Lists",
            icon: "fas fa-list",
            routerLink: "/wealth/marketing-lists/all",
            order: 0,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "allMarketingLists",
              },
            },
          },
          {
            id: "10-2",
            label: "Active Campaigns",
            icon: "fas fa-bullhorn",
            routerLink: "/wealth/marketing-lists/active-campaigns",
            order: 1,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "activeCampaigns",
              },
            },
          },
          {
            id: "10-3",
            label: "Client Segmentation",
            icon: "fas fa-chart-pie",
            routerLink: "/wealth/marketing-lists/segmentation",
            order: 2,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "clientSegmentation",
              },
            },
          },
          {
            id: "10-4",
            label: "Investment Preferences",
            icon: "fas fa-chart-line",
            routerLink: "/wealth/marketing-lists/investment-preferences",
            order: 3,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "investmentPreferences",
              },
            },
          },
          {
            id: "10-5",
            label: "Client Tiers",
            icon: "fas fa-layer-group",
            routerLink: "/wealth/marketing-lists/client-tiers",
            order: 4,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "clientTiers",
              },
            },
          },
        ],
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "marketingLists",
          },
        },
      },
      {
        id: "11",
        label: "Service Requests",
        icon: "fas fa-hand-holding",
        routerLink: "/wealth/service-requests",
        order: 10,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "serviceRequests",
          },
        },
      },
      {
        id: "12",
        label: "Pipeline",
        icon: "fas fa-network-wired",
        routerLink: "/wealth/pipeline",
        order: 11,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "pipeline",
          },
        },
      },
    ];
  }

  /**
   * Get a minimal 2-level structure for testing.
   */
  getMinimalMenuStructure(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Home",
        icon: "fas fa-home",
        routerLink: "/home",
        order: 0,
      },
      {
        id: "2",
        label: "About",
        icon: "fas fa-info-circle",
        routerLink: "/about",
        order: 1,
        expanded: false,
        children: [
          {
            id: "2-1",
            label: "Team",
            icon: "fas fa-users",
            routerLink: "/about/team",
            order: 0,
          },
          {
            id: "2-2",
            label: "Company",
            icon: "fas fa-building",
            routerLink: "/about/company",
            order: 1,
          },
        ],
      },
      {
        id: "3",
        label: "Contact",
        icon: "fas fa-envelope",
        routerLink: "/contact",
        order: 2,
      },
    ];
  }

  /**
   * Get a deep 5-level structure for testing max depth.
   */
  getDeepMenuStructure(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Level 1",
        icon: "fas fa-layer-group",
        order: 0,
        expanded: true,
        children: [
          {
            id: "1-1",
            label: "Level 2",
            icon: "fas fa-layer-group",
            order: 0,
            expanded: true,
            children: [
              {
                id: "1-1-1",
                label: "Level 3",
                icon: "fas fa-layer-group",
                order: 0,
                expanded: true,
                children: [
                  {
                    id: "1-1-1-1",
                    label: "Level 4",
                    icon: "fas fa-layer-group",
                    order: 0,
                    expanded: true,
                    children: [
                      {
                        id: "1-1-1-1-1",
                        label: "Level 5 (Max)",
                        icon: "fas fa-check-circle",
                        routerLink: "/deep/level5",
                        order: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Get wealth management menu structure.
   * Based on wealth management field navigation requirements.
   * Marketing Lists has submenu items.
   */
  getWealthManagementMenuStructure(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Overview",
        icon: "fas fa-home",
        routerLink: "/wealth/overview",
        order: 0,
        contentConfig: {
          componentType: "dashboard",
          settings: {
            dashboardType: "overview",
          },
        },
      },
      {
        id: "2",
        label: "Bulk And Breaches",
        icon: "fas fa-bullseye-pointer",
        routerLink: "/wealth/bulk-and-breaches",
        order: 1,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "bulkAndBreaches",
          },
        },
      },
      {
        id: "3",
        label: "Contacts",
        icon: "fas fa-address-card",
        routerLink: "/wealth/contacts",
        order: 2,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "contacts",
          },
        },
      },
      {
        id: "4",
        label: "Prospects",
        icon: "fas fa-file-search",
        routerLink: "/wealth/prospects",
        order: 3,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "prospects",
          },
        },
      },
      {
        id: "5",
        label: "Opportunities",
        icon: "fas fa-lightbulb-dollar",
        routerLink: "/wealth/opportunities",
        order: 4,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "opportunities",
          },
        },
      },
      {
        id: "6",
        label: "Advisers",
        icon: "fas fa-link",
        routerLink: "/wealth/advisers",
        order: 5,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "advisers",
          },
        },
      },
      {
        id: "7",
        label: "Intermediaries",
        icon: "fas fa-building",
        routerLink: "/wealth/intermediaries",
        order: 6,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "intermediaries",
          },
        },
      },
      {
        id: "8",
        label: "Families",
        icon: "fas fa-users",
        routerLink: "/wealth/families",
        order: 7,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "families",
          },
        },
      },
      {
        id: "9",
        label: "Suitability Reviews",
        icon: "fas fa-search-dollar",
        routerLink: "/wealth/suitability-reviews",
        order: 8,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "suitabilityReviews",
          },
        },
      },
      {
        id: "10",
        label: "Marketing Lists",
        icon: "fas fa-bullseye-pointer",
        routerLink: "/wealth/marketing-lists",
        order: 9,
        expanded: false,
        children: [
          {
            id: "10-1",
            label: "All Lists",
            icon: "fas fa-list",
            routerLink: "/wealth/marketing-lists/all",
            order: 0,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "allMarketingLists",
              },
            },
          },
          {
            id: "10-2",
            label: "Active Campaigns",
            icon: "fas fa-bullhorn",
            routerLink: "/wealth/marketing-lists/active-campaigns",
            order: 1,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "activeCampaigns",
              },
            },
          },
          {
            id: "10-3",
            label: "Client Segmentation",
            icon: "fas fa-chart-pie",
            routerLink: "/wealth/marketing-lists/segmentation",
            order: 2,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "clientSegmentation",
              },
            },
          },
          {
            id: "10-4",
            label: "Investment Preferences",
            icon: "fas fa-chart-line",
            routerLink: "/wealth/marketing-lists/investment-preferences",
            order: 3,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "investmentPreferences",
              },
            },
          },
          {
            id: "10-5",
            label: "Client Tiers",
            icon: "fas fa-layer-group",
            routerLink: "/wealth/marketing-lists/client-tiers",
            order: 4,
            contentConfig: {
              componentType: "grid",
              settings: {
                gridType: "clientTiers",
              },
            },
          },
        ],
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "marketingLists",
          },
        },
      },
      {
        id: "11",
        label: "Service Requests",
        icon: "fas fa-hand-holding",
        routerLink: "/wealth/service-requests",
        order: 10,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "serviceRequests",
          },
        },
      },
      {
        id: "12",
        label: "Pipeline",
        icon: "fas fa-network-wired",
        routerLink: "/wealth/pipeline",
        order: 11,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "pipeline",
          },
        },
      },
    ];
  }
}
