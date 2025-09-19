import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  standalone: false,
  selector: 'Ag-grid-wrapper-icon',
  templateUrl: './Ag-grid-wrapper-icon.component.html',
})
export class AgGridWrapperIconComponent implements ICellRendererAngularComp {
  public params: any;

  constructor(private router: Router) {}

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return false;
  }
}
