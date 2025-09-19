import { AgGridWrapperActionsComponent } from 'src/libs/ag-grid-wrapper/src/lib/ag-grid-wrapper-actions.component';
import { AgGridWrapperCopyPasteComponent } from './ag-grid-wrapper-copy-paste.component';
import { AgGridWrapperIconComponent } from './ag-grid-wrapper-icon.component';
import { AgGridWrapperLinkComponent } from './ag-grid-wrapper-link.component';

export const ColumnTypeMappings = {
  link: AgGridWrapperLinkComponent,
  copyPaste: AgGridWrapperCopyPasteComponent,
  icon: AgGridWrapperIconComponent,
  actions: AgGridWrapperActionsComponent,
};
