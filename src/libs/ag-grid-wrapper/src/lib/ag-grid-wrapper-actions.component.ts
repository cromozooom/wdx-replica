import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellParams } from 'src/core/components/portal-grid-wrapper/portal-grid-wrapper.models';

@Component({
  standalone: false,
  selector: 'Ag-grid-wrapper-actions',
  templateUrl: './Ag-grid-wrapper-actions.component.html',
})
export class AgGridWrapperActionsComponent implements ICellRendererAngularComp {
  public params: any;
  public rowData: any;
  public actions: any;
  handleAction: (params: ICellParams, action: any) => void;

  constructor(private router: Router) {}

  agInit(params: any): void {
    this.params = params;
    this.rowData = params.data;
    this.actions = params?.actions || '';
    this.handleAction = params.handleAction;
  }

  refresh(params: any): boolean {
    this.params = params;
    this.rowData = params.data;
    this.actions = params?.actions || '';
    return false;
  }

  resolveAction(action: any): void {
    this.handleAction?.(this.params, action);
  }
}
