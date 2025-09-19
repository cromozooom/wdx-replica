import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  standalone: false,
  selector: 'Ag-grid-wrapper-link',
  templateUrl: './Ag-grid-wrapper-link.component.html',
})
export class AgGridWrapperLinkComponent implements ICellRendererAngularComp {
  public params: any;

  private urlTemplate: string;
  private handleNavigate: (params: any) => void;
  private customActions: any;
  private actionKey: string;

  constructor(private router: Router) {}

  agInit(params: any): void {
    this.params = params;
    this.urlTemplate = params?.urlTemplate || '';
    this.handleNavigate = params?.handleNavigate;
    this.customActions = params?.customActions;
    this.actionKey = params?.actionKey;
  }

  refresh(params: any): boolean {
    this.params = params;
    this.handleNavigate = params?.handleNavigate;
    this.customActions = params?.customActions;
    this.actionKey = params?.actionKey;
    return false;
  }

  onExternalLinkClick(event) {
    event.stopPropagation();
    const originalLink = { ...this.params.link };
    this.params.link = { ...this.params.link, ForceOpenInNewWindow: true };

    try {
      this.onLinkClick();
    } finally {
      this.params.link = originalLink;
    }
  }

  onLinkClick() {
    // NEW: Check for actionKey and call custom action if present
    if (this.actionKey && this.customActions && typeof this.customActions[this.actionKey] === 'function') {
      this.customActions[this.actionKey](this.params);
      return;
    }
    if (this.handleNavigate) {
      this.handleNavigate(this.params);
      return;
    }

    const rowData = this.params?.data;
    if (!this.urlTemplate || !rowData) {
      return;
    }

    let constructedUrl = this.urlTemplate;
    const regex = /{(\w+)}/g;
    let match;
    while ((match = regex.exec(this.urlTemplate)) !== null) {
      const fieldName = match[1];
      const fieldValue = rowData[fieldName];
      if (fieldValue === undefined || fieldValue === null) {
        console.error(`Field "${fieldName}" is missing in row data.`);
        return;
      }
      constructedUrl = constructedUrl.replace(`{${fieldName}}`, fieldValue);
    }

    this.router.navigate([constructedUrl]);
  }
}
