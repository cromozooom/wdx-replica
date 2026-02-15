import { Component, ChangeDetectionStrategy, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbDropdownModule, NgbModal } from "@ng-bootstrap/ng-bootstrap";

/**
 * SPX Tools - Reusable tools dropdown with modals
 * Provides access to various builder and utility tools
 */
@Component({
  selector: "app-spx-tools",
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: "./spx-tools.component.html",
  styleUrls: ["./spx-tools.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpxToolsComponent {
  constructor(private modalService: NgbModal) {}

  /**
   * Open Inspector modal in fullscreen
   */
  openInspectorModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Import/Export modal in fullscreen
   */
  openImportExportModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Query Builder modal in fullscreen
   */
  openQueryBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Form Builder modal in fullscreen
   */
  openFormBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Dashboard Builder modal in fullscreen
   */
  openDashboardBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }
}
