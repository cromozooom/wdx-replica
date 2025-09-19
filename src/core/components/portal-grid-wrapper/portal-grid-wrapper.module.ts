import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/core/modules/shared/shared.module';
import { PortalLoadModule } from '../portal-load/portal-load.module';
import { PortalQuerySelectorModule } from '../portal-query-selector/portal-query-selector.module';
import { PortalGridWrapperEditorComponent } from './portal-grid-wrapper-editor.component';
import { PortalGridWrapperComponent } from './portal-grid-wrapper.component';

@NgModule({
  imports: [CommonModule, FormsModule, SharedModule, NgSelectModule, PortalLoadModule, NgbDropdownModule, PortalQuerySelectorModule],
  declarations: [PortalGridWrapperComponent, PortalGridWrapperEditorComponent],
  exports: [PortalGridWrapperComponent, PortalGridWrapperEditorComponent],
})
export class PortalGridWrapperModule {}
