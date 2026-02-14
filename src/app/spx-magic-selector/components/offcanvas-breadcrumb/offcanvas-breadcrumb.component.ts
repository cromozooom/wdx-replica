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
  templateUrl: "./offcanvas-breadcrumb.component.html",
  styleUrls: ["./offcanvas-breadcrumb.component.scss"],
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
