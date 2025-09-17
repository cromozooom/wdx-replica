import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { PortalLoadModule } from 'src/core/components/portal-load/portal-load.module';
import { AgGridWrapperActionsComponent } from './ag-grid-wrapper-actions.component';
import { AgGridWrapperCopyPasteComponent } from './ag-grid-wrapper-copy-paste.component';
import { AgGridWrapperIconComponent } from './ag-grid-wrapper-icon.component';
import { AgGridWrapperLinkComponent } from './ag-grid-wrapper-link.component';
import { AgGridWrapperComponent } from './ag-grid-wrapper.component';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// Set the license key like this after ag-grid-wrapper has been moved to another repository.
// LicenseManager.setLicenseKey(
//   '<key>',
// );

@NgModule({
  imports: [CommonModule, FormsModule, NgSelectModule, PortalLoadModule, AgGridModule, NgbDropdownModule],
  declarations: [
    AgGridWrapperComponent,
    AgGridWrapperLinkComponent,
    AgGridWrapperCopyPasteComponent,
    AgGridWrapperIconComponent,
    AgGridWrapperActionsComponent,
  ],
  exports: [AgGridWrapperComponent, AgGridWrapperLinkComponent, AgGridWrapperCopyPasteComponent, AgGridWrapperActionsComponent],
})
export class AgGridWrapperModule {}
