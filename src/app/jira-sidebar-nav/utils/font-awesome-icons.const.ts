/**
 * FontAwesome Free Icons Dictionary
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * Contains 80 commonly used icons from FontAwesome 6.7.2 Free (fas, far, fab).
 * Icons are organized by category for easier discovery in the icon picker.
 *
 * @see specs/001-jira-sidebar-nav/research.md section 6 for icon structure
 */

import { IconDefinition } from "../models";

export const FONT_AWESOME_ICONS: IconDefinition[] = [
  // Navigation & UI (15 icons)
  {
    id: "fa-home",
    label: "Home",
    category: "Navigation",
    cssClass: "fas fa-home",
  },
  {
    id: "fa-bars",
    label: "Menu",
    category: "Navigation",
    cssClass: "fas fa-bars",
  },
  {
    id: "fa-search",
    label: "Search",
    category: "Navigation",
    cssClass: "fas fa-search",
  },
  {
    id: "fa-cog",
    label: "Settings",
    category: "Navigation",
    cssClass: "fas fa-cog",
  },
  {
    id: "fa-bell",
    label: "Notifications",
    category: "Navigation",
    cssClass: "fas fa-bell",
  },
  {
    id: "fa-user",
    label: "User",
    category: "Navigation",
    cssClass: "fas fa-user",
  },
  {
    id: "fa-dashboard",
    label: "Dashboard",
    category: "Navigation",
    cssClass: "fas fa-tachometer-alt",
  },
  {
    id: "fa-list",
    label: "List",
    category: "Navigation",
    cssClass: "fas fa-list",
  },
  {
    id: "fa-grid",
    label: "Grid",
    category: "Navigation",
    cssClass: "fas fa-th",
  },
  {
    id: "fa-filter",
    label: "Filter",
    category: "Navigation",
    cssClass: "fas fa-filter",
  },
  {
    id: "fa-sort",
    label: "Sort",
    category: "Navigation",
    cssClass: "fas fa-sort",
  },
  {
    id: "fa-calendar",
    label: "Calendar",
    category: "Navigation",
    cssClass: "fas fa-calendar",
  },
  {
    id: "fa-clock",
    label: "Clock",
    category: "Navigation",
    cssClass: "fas fa-clock",
  },
  {
    id: "fa-star",
    label: "Star",
    category: "Navigation",
    cssClass: "fas fa-star",
  },
  {
    id: "fa-bookmark",
    label: "Bookmark",
    category: "Navigation",
    cssClass: "fas fa-bookmark",
  },

  // Files & Documents (12 icons)
  { id: "fa-file", label: "File", category: "Files", cssClass: "fas fa-file" },
  {
    id: "fa-folder",
    label: "Folder",
    category: "Files",
    cssClass: "fas fa-folder",
  },
  {
    id: "fa-folder-open",
    label: "Folder Open",
    category: "Files",
    cssClass: "fas fa-folder-open",
  },
  {
    id: "fa-file-alt",
    label: "Document",
    category: "Files",
    cssClass: "fas fa-file-alt",
  },
  {
    id: "fa-file-code",
    label: "Code File",
    category: "Files",
    cssClass: "fas fa-file-code",
  },
  {
    id: "fa-file-pdf",
    label: "PDF",
    category: "Files",
    cssClass: "fas fa-file-pdf",
  },
  {
    id: "fa-file-image",
    label: "Image",
    category: "Files",
    cssClass: "fas fa-file-image",
  },
  {
    id: "fa-download",
    label: "Download",
    category: "Files",
    cssClass: "fas fa-download",
  },
  {
    id: "fa-upload",
    label: "Upload",
    category: "Files",
    cssClass: "fas fa-upload",
  },
  { id: "fa-copy", label: "Copy", category: "Files", cssClass: "fas fa-copy" },
  {
    id: "fa-paste",
    label: "Paste",
    category: "Files",
    cssClass: "fas fa-paste",
  },
  {
    id: "fa-archive",
    label: "Archive",
    category: "Files",
    cssClass: "fas fa-archive",
  },

  // Actions & Editing (15 icons)
  { id: "fa-plus", label: "Add", category: "Actions", cssClass: "fas fa-plus" },
  {
    id: "fa-minus",
    label: "Remove",
    category: "Actions",
    cssClass: "fas fa-minus",
  },
  {
    id: "fa-edit",
    label: "Edit",
    category: "Actions",
    cssClass: "fas fa-edit",
  },
  {
    id: "fa-trash",
    label: "Delete",
    category: "Actions",
    cssClass: "fas fa-trash",
  },
  {
    id: "fa-save",
    label: "Save",
    category: "Actions",
    cssClass: "fas fa-save",
  },
  {
    id: "fa-check",
    label: "Confirm",
    category: "Actions",
    cssClass: "fas fa-check",
  },
  {
    id: "fa-times",
    label: "Cancel",
    category: "Actions",
    cssClass: "fas fa-times",
  },
  {
    id: "fa-undo",
    label: "Undo",
    category: "Actions",
    cssClass: "fas fa-undo",
  },
  {
    id: "fa-redo",
    label: "Redo",
    category: "Actions",
    cssClass: "fas fa-redo",
  },
  {
    id: "fa-sync",
    label: "Refresh",
    category: "Actions",
    cssClass: "fas fa-sync",
  },
  {
    id: "fa-play",
    label: "Play",
    category: "Actions",
    cssClass: "fas fa-play",
  },
  {
    id: "fa-pause",
    label: "Pause",
    category: "Actions",
    cssClass: "fas fa-pause",
  },
  {
    id: "fa-stop",
    label: "Stop",
    category: "Actions",
    cssClass: "fas fa-stop",
  },
  {
    id: "fa-lock",
    label: "Lock",
    category: "Actions",
    cssClass: "fas fa-lock",
  },
  {
    id: "fa-unlock",
    label: "Unlock",
    category: "Actions",
    cssClass: "fas fa-unlock",
  },

  // Communication (10 icons)
  {
    id: "fa-envelope",
    label: "Email",
    category: "Communication",
    cssClass: "fas fa-envelope",
  },
  {
    id: "fa-comment",
    label: "Comment",
    category: "Communication",
    cssClass: "fas fa-comment",
  },
  {
    id: "fa-comments",
    label: "Comments",
    category: "Communication",
    cssClass: "fas fa-comments",
  },
  {
    id: "fa-phone",
    label: "Phone",
    category: "Communication",
    cssClass: "fas fa-phone",
  },
  {
    id: "fa-video",
    label: "Video",
    category: "Communication",
    cssClass: "fas fa-video",
  },
  {
    id: "fa-share",
    label: "Share",
    category: "Communication",
    cssClass: "fas fa-share",
  },
  {
    id: "fa-paper-plane",
    label: "Send",
    category: "Communication",
    cssClass: "fas fa-paper-plane",
  },
  {
    id: "fa-inbox",
    label: "Inbox",
    category: "Communication",
    cssClass: "fas fa-inbox",
  },
  {
    id: "fa-at",
    label: "Mention",
    category: "Communication",
    cssClass: "fas fa-at",
  },
  {
    id: "fa-rss",
    label: "Feed",
    category: "Communication",
    cssClass: "fas fa-rss",
  },

  // Status & Indicators (10 icons)
  {
    id: "fa-info-circle",
    label: "Info",
    category: "Status",
    cssClass: "fas fa-info-circle",
  },
  {
    id: "fa-exclamation-triangle",
    label: "Warning",
    category: "Status",
    cssClass: "fas fa-exclamation-triangle",
  },
  {
    id: "fa-check-circle",
    label: "Success",
    category: "Status",
    cssClass: "fas fa-check-circle",
  },
  {
    id: "fa-times-circle",
    label: "Error",
    category: "Status",
    cssClass: "fas fa-times-circle",
  },
  {
    id: "fa-question-circle",
    label: "Help",
    category: "Status",
    cssClass: "fas fa-question-circle",
  },
  {
    id: "fa-spinner",
    label: "Loading",
    category: "Status",
    cssClass: "fas fa-spinner",
  },
  {
    id: "fa-circle",
    label: "Circle",
    category: "Status",
    cssClass: "fas fa-circle",
  },
  {
    id: "fa-square",
    label: "Square",
    category: "Status",
    cssClass: "fas fa-square",
  },
  {
    id: "fa-heart",
    label: "Favorite",
    category: "Status",
    cssClass: "fas fa-heart",
  },
  { id: "fa-flag", label: "Flag", category: "Status", cssClass: "fas fa-flag" },

  // Development & Tools (10 icons)
  {
    id: "fa-code",
    label: "Code",
    category: "Development",
    cssClass: "fas fa-code",
  },
  {
    id: "fa-terminal",
    label: "Terminal",
    category: "Development",
    cssClass: "fas fa-terminal",
  },
  {
    id: "fa-bug",
    label: "Bug",
    category: "Development",
    cssClass: "fas fa-bug",
  },
  {
    id: "fa-wrench",
    label: "Tools",
    category: "Development",
    cssClass: "fas fa-wrench",
  },
  {
    id: "fa-hammer",
    label: "Build",
    category: "Development",
    cssClass: "fas fa-hammer",
  },
  {
    id: "fa-database",
    label: "Database",
    category: "Development",
    cssClass: "fas fa-database",
  },
  {
    id: "fa-server",
    label: "Server",
    category: "Development",
    cssClass: "fas fa-server",
  },
  {
    id: "fa-cloud",
    label: "Cloud",
    category: "Development",
    cssClass: "fas fa-cloud",
  },
  {
    id: "fa-git-alt",
    label: "Git",
    category: "Development",
    cssClass: "fab fa-git-alt",
  },
  {
    id: "fa-github",
    label: "GitHub",
    category: "Development",
    cssClass: "fab fa-github",
  },

  // Business & Analytics (8 icons)
  {
    id: "fa-chart-bar",
    label: "Bar Chart",
    category: "Analytics",
    cssClass: "fas fa-chart-bar",
  },
  {
    id: "fa-chart-line",
    label: "Line Chart",
    category: "Analytics",
    cssClass: "fas fa-chart-line",
  },
  {
    id: "fa-chart-pie",
    label: "Pie Chart",
    category: "Analytics",
    cssClass: "fas fa-chart-pie",
  },
  {
    id: "fa-analytics",
    label: "Analytics",
    category: "Analytics",
    cssClass: "fas fa-chart-area",
  },
  {
    id: "fa-briefcase",
    label: "Business",
    category: "Analytics",
    cssClass: "fas fa-briefcase",
  },
  {
    id: "fa-money-bill",
    label: "Finance",
    category: "Analytics",
    cssClass: "fas fa-dollar-sign",
  },
  {
    id: "fa-shopping-cart",
    label: "Shopping",
    category: "Analytics",
    cssClass: "fas fa-shopping-cart",
  },
  { id: "fa-tag", label: "Tag", category: "Analytics", cssClass: "fas fa-tag" },
];

/**
 * Get icons filtered by category
 */
export function getIconsByCategory(category: string): IconDefinition[] {
  return FONT_AWESOME_ICONS.filter((icon) => icon.category === category);
}

/**
 * Get unique categories
 */
export function getIconCategories(): string[] {
  const categories = FONT_AWESOME_ICONS.map((icon) => icon.category);
  return Array.from(new Set(categories)).sort();
}

/**
 * Find icon by ID
 */
export function findIconById(id: string): IconDefinition | undefined {
  return FONT_AWESOME_ICONS.find((icon) => icon.id === id);
}
