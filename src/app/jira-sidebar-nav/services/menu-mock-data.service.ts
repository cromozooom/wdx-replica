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
   * Get default menu structure (3 levels).
   * Uses hierarchical IDs (e.g., "1", "1-1", "1-1-1") for clarity.
   */
  getDefaultMenuStructure(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Dashboard",
        icon: "fas fa-tachometer-alt",
        routerLink: "/dashboard",
        order: 0,
        expanded: false,
        children: [
          {
            id: "1-1",
            label: "Analytics",
            icon: "fas fa-chart-line",
            routerLink: "/dashboard/analytics",
            order: 0,
            expanded: false,
            children: [
              {
                id: "1-1-1",
                label: "Real-time",
                icon: "fas fa-broadcast-tower",
                routerLink: "/dashboard/analytics/realtime",
                order: 0,
                contentConfig: {
                  componentType: "dashboard",
                  settings: {
                    refreshInterval: 5000,
                    showLiveData: true,
                  },
                },
              },
              {
                id: "1-1-2",
                label: "Historical",
                icon: "fas fa-history",
                routerLink: "/dashboard/analytics/historical",
                order: 1,
                contentConfig: {
                  componentType: "dashboard",
                  settings: {
                    dateRange: "last30days",
                    aggregation: "daily",
                  },
                },
              },
            ],
          },
          {
            id: "1-2",
            label: "Reports",
            icon: "fas fa-file-alt",
            routerLink: "/dashboard/reports",
            order: 1,
            expanded: false,
            children: [
              {
                id: "1-2-1",
                label: "Monthly",
                icon: "fas fa-calendar-alt",
                routerLink: "/dashboard/reports/monthly",
                order: 0,
                contentConfig: {
                  componentType: "report",
                  settings: {
                    reportType: "monthly",
                    format: "pdf",
                  },
                },
              },
              {
                id: "1-2-2",
                label: "Quarterly",
                icon: "fas fa-calendar-week",
                routerLink: "/dashboard/reports/quarterly",
                order: 1,
                contentConfig: {
                  componentType: "report",
                  settings: {
                    reportType: "quarterly",
                    includeComparison: true,
                  },
                },
              },
              {
                id: "1-2-3",
                label: "Annual",
                icon: "fas fa-calendar",
                routerLink: "/dashboard/reports/annual",
                order: 2,
                contentConfig: {
                  componentType: "report",
                  settings: {
                    reportType: "annual",
                    includeSummary: true,
                  },
                },
              },
            ],
          },
        ],
      },
      {
        id: "2",
        label: "Projects",
        icon: "fas fa-folder",
        routerLink: "/projects",
        order: 1,
        expanded: false,
        children: [
          {
            id: "2-1",
            label: "Active",
            icon: "fas fa-folder-open",
            routerLink: "/projects/active",
            order: 0,
            expanded: false,
            children: [
              {
                id: "2-1-1",
                label: "Project Alpha",
                icon: "fas fa-project-diagram",
                routerLink: "/projects/active/alpha",
                order: 0,
                contentConfig: {
                  componentType: "project",
                  settings: {
                    projectId: "alpha",
                    status: "active",
                  },
                },
              },
              {
                id: "2-1-2",
                label: "Project Beta",
                icon: "fas fa-project-diagram",
                routerLink: "/projects/active/beta",
                order: 1,
                contentConfig: {
                  componentType: "project",
                  settings: {
                    projectId: "beta",
                    status: "active",
                  },
                },
              },
              {
                id: "2-1-3",
                label: "Project Gamma",
                icon: "fas fa-project-diagram",
                routerLink: "/projects/active/gamma",
                order: 2,
                contentConfig: {
                  componentType: "project",
                  settings: {
                    projectId: "gamma",
                    status: "active",
                  },
                },
              },
            ],
          },
          {
            id: "2-2",
            label: "Archived",
            icon: "fas fa-archive",
            routerLink: "/projects/archived",
            order: 1,
            expanded: false,
            children: [
              {
                id: "2-2-1",
                label: "2025 Projects",
                icon: "fas fa-calendar-times",
                routerLink: "/projects/archived/2025",
                order: 0,
                contentConfig: {
                  componentType: "grid",
                  settings: {
                    gridType: "archivedProjects",
                    year: 2025,
                  },
                },
              },
              {
                id: "2-2-2",
                label: "2024 Projects",
                icon: "fas fa-calendar-times",
                routerLink: "/projects/archived/2024",
                order: 1,
                contentConfig: {
                  componentType: "grid",
                  settings: {
                    gridType: "archivedProjects",
                    year: 2024,
                  },
                },
              },
            ],
          },
        ],
      },
      {
        id: "3",
        label: "Settings",
        icon: "fas fa-cog",
        routerLink: "/settings",
        order: 2,
        expanded: false,
        children: [
          {
            id: "3-1",
            label: "User Profile",
            icon: "fas fa-user",
            routerLink: "/settings/profile",
            order: 0,
            contentConfig: {
              componentType: "form",
              settings: {
                formType: "userProfile",
                editable: true,
              },
            },
          },
          {
            id: "3-2",
            label: "Preferences",
            icon: "fas fa-sliders-h",
            routerLink: "/settings/preferences",
            order: 1,
            expanded: false,
            children: [
              {
                id: "3-2-1",
                label: "Appearance",
                icon: "fas fa-palette",
                routerLink: "/settings/preferences/appearance",
                order: 0,
                contentConfig: {
                  componentType: "form",
                  settings: {
                    formType: "appearance",
                    themes: ["light", "dark", "auto"],
                  },
                },
              },
              {
                id: "3-2-2",
                label: "Notifications",
                icon: "fas fa-bell",
                routerLink: "/settings/preferences/notifications",
                order: 1,
                contentConfig: {
                  componentType: "form",
                  settings: {
                    formType: "notifications",
                    channels: ["email", "push", "sms"],
                  },
                },
              },
            ],
          },
          {
            id: "3-3",
            label: "Security",
            icon: "fas fa-shield-alt",
            routerLink: "/settings/security",
            order: 2,
            contentConfig: {
              componentType: "form",
              settings: {
                formType: "security",
                requiresAuth: true,
              },
              permissions: ["admin", "security_manager"],
            },
          },
        ],
      },
      {
        id: "4",
        label: "Help",
        icon: "fas fa-question-circle",
        routerLink: "/help",
        order: 3,
        expanded: false,
        children: [
          {
            id: "4-1",
            label: "Documentation",
            icon: "fas fa-book",
            routerLink: "/help/docs",
            order: 0,
            contentConfig: {
              componentType: "documentation",
              settings: {
                searchEnabled: true,
                version: "latest",
              },
            },
          },
          {
            id: "4-2",
            label: "Support",
            icon: "fas fa-life-ring",
            routerLink: "/help/support",
            order: 1,
            contentConfig: {
              componentType: "support",
              settings: {
                ticketingEnabled: true,
                chatEnabled: true,
              },
            },
          },
        ],
      },
      {
        id: "5",
        label: "Team",
        icon: "fas fa-users",
        routerLink: "/team",
        order: 4,
        contentConfig: {
          componentType: "grid",
          settings: {
            gridType: "teamMembers",
            columns: ["name", "role", "email"],
          },
        },
      },
      {
        id: "6",
        label: "Calendar",
        icon: "fas fa-calendar-alt",
        routerLink: "/calendar",
        order: 5,
        contentConfig: {
          componentType: "calendar",
          settings: {
            view: "month",
            showWeekends: true,
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
}
