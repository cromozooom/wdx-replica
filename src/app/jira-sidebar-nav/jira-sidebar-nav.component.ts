import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Root component for jira-sidebar-nav feature module.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * This is a placeholder component that will be implemented in Phase 3.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-jira-sidebar-nav",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="jira-sidebar-nav-placeholder">
      <h2>Jira Sidebar Navigation</h2>
      <p>Feature under development - Phase 1 Setup Complete</p>
    </div>
  `,
  styles: [
    `
      .jira-sidebar-nav-placeholder {
        padding: 2rem;
        text-align: center;
      }
    `,
  ],
})
export class JiraSidebarNavComponent {}
