import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { OffcanvasStackService } from "../../services/offcanvas-stack.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

/**
 * Breadcrumb component for offcanvas navigation
 * Shows the current path through stacked offcanvases
 */
@Component({
  selector: "app-offcanvas-breadcrumb",
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Offcanvas breadcrumb" *ngIf="breadcrumbs.length > 1">
      <ol class="breadcrumb mb-0">
        <li
          *ngFor="let crumb of breadcrumbs; let last = last"
          class="breadcrumb-item"
          [class.active]="crumb.isActive"
        >
          <button
            *ngIf="!crumb.isActive"
            type="button"
            class="btn btn-link p-0 text-decoration-none breadcrumb-btn"
            (click)="navigateToLevel(crumb.level)"
            [attr.aria-label]="'Navigate to ' + crumb.title"
          >
            {{ crumb.title }}
          </button>
          <span *ngIf="crumb.isActive" aria-current="page">
            {{ crumb.title }}
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      .breadcrumb {
        font-size: 0.875rem;
        background: transparent;
        padding: 0;
      }

      .breadcrumb-item {
        color: var(--bs-secondary);
      }

      .breadcrumb-item.active {
        color: var(--bs-body-color);
        font-weight: 500;
      }

      .breadcrumb-btn {
        color: inherit !important;
        font-size: inherit;
        line-height: inherit;
      }

      .breadcrumb-btn:hover {
        color: var(--bs-primary) !important;
        text-decoration: underline !important;
      }

      .breadcrumb-item + .breadcrumb-item::before {
        content: var(--bs-breadcrumb-divider, "/");
        color: var(--bs-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffcanvasBreadcrumbComponent implements OnInit, OnDestroy {
  breadcrumbs: Array<{ title: string; level: number; isActive: boolean }> = [];
  private destroy$ = new Subject<void>();

  constructor(private offcanvasStackService: OffcanvasStackService) {}

  ngOnInit(): void {
    this.offcanvasStackService.stack$
      .pipe(takeUntil(this.destroy$))
      .subscribe((stack) => {
        this.breadcrumbs = this.offcanvasStackService.getBreadcrumbs();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToLevel(level: number): void {
    this.offcanvasStackService.navigateToLevel(level);
  }
}
