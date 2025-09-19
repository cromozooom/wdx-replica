import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  standalone: false,
  selector: 'ag-grid-wrapper-copy-paste',
  templateUrl: './ag-grid-wrapper-copy-paste.component.html',
  host: {
    '[style.width]': '"100%"',
    '[style.height]': '"100%"',
    '[style.display]': '"flex"',
    '[style.flexDirection]': '"column"',
    '[style.alignItems]': '"start"',
    '[style.justifyContent]': '"center"', // This centers content vertically as well
  },
})
export class AgGridWrapperCopyPasteComponent implements ICellRendererAngularComp {
  public params: any;
  public rowData: any;
  public isPasteMode: boolean = false;
  private handleCopy: (templateId: number) => void;
  private toggleSelected: (templateId: number, checked: boolean) => void;
  private getIsPasteMode: () => boolean;
  private getCopiedId: () => string;
  public checked: boolean = false;
  public currentSelected: any;

  agInit(params: any): void {
    this.params = params;
    this.rowData = params.data;

    this.handleCopy = params?.handleCopy;
    this.toggleSelected = params?.toggleSelected;
    this.getIsPasteMode = params?.getIsPasteMode;
    this.getCopiedId = params?.getCopiedId;
    this.isPasteMode = this.getIsPasteMode();
    this.currentSelected = this.getCopiedId();
  }

  refresh(params: any): boolean {
    this.params = params;
    this.rowData = params.data;
    this.handleCopy = params?.handleCopy;
    this.toggleSelected = params?.toggleSelected;
    this.getIsPasteMode = params?.getIsPasteMode;
    this.isPasteMode = this.getIsPasteMode();
    this.checked = false;
    this.currentSelected = this.getCopiedId();
    return true;
  }

  onCopyClick() {
    if (this.rowData?.DocumentTemplateId) {
      this.handleCopy(this.rowData.DocumentTemplateId);
    }
  }

  onCheckboxChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    if (this.rowData?.DocumentTemplateId) {
      this.toggleSelected(this.rowData.DocumentTemplateId, isChecked);
    }
    this.checked = isChecked;
  }
}
