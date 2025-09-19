import { Component, ComponentRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { deepClone } from 'src/core/common/common-object-functions';
import { PortalComponentLoaderComponent } from 'src/core/components/specials/portal-component-loader/portal-component-loader.component';
import { LazyLoadComponents } from 'src/core/models/lazy-load-components';
import { Link } from 'src/core/models/utils/link';
import { CentraleService } from 'src/core/services/centrale.service';
import { LazyLoaderService } from 'src/core/services/lazy-loader.service';
import { LinkService } from 'src/core/services/link.service';
import { SharedService } from 'src/core/services/shared.service';
import { DictionaryItem } from 'src/libs/entity-evaluator/src/lib/models/entity-evaluator-models';
import { ApiMetaData, ColDef, ICellParams } from './portal-grid-wrapper.models';

@Component({
  standalone: false,
  selector: 'portal-grid-wrapper',
  templateUrl: './portal-grid-wrapper.component.html',
})
export class PortalGridWrapperComponent implements OnInit, OnChanges, OnDestroy {
  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() dashboardQuery: string;
  @Input() parameters: DictionaryItem[] = [];
  @Input() fetchXml: string;
  @Input() dashboardQueryName: string;
  @Input() pagination: boolean = true;
  @Input() paginationPageSize: number = 20;
  @Input() apiMetaData: ApiMetaData;
  @Input() columnsVersion: number;
  @Input() rowSelection: string;
  @Input() enableCheckboxSelection: boolean = true;
  @Input() customActions: Record<string, (params: any) => void>; // NEW: custom actions map
  @Input() public version: string = '';
  @Output() rowSelected = new EventEmitter<any[]>();

  @ViewChild('agGridContainer', { read: ViewContainerRef, static: true })
  gridContainer: ViewContainerRef;

  @ViewChild('actionLoader') actionLoader: PortalComponentLoaderComponent;

  private gridWrapperRef: ComponentRef<any>;

  constructor(
    private lazyLoaderService: LazyLoaderService,
    private centraleService: CentraleService,
    private sharedService: SharedService,
  ) {}

  ngOnInit(): void {
    this.loadAgGridWrapper();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridWrapperRef && this.gridWrapperRef.instance) {
      if (changes.rowData && !changes.rowData.firstChange) {
        this.gridWrapperRef.instance.rowData = this.rowData;
      }
      if (changes.columnDefs && !changes.columnDefs.firstChange) {
        this.gridWrapperRef.setInput('columnDefs', this.processColumnDefs(this.columnDefs));
      }
      if (changes.dashboardQuery && !changes.dashboardQuery.firstChange) {
        this.gridWrapperRef.instance.dashboardQuery = this.dashboardQuery;
      }
      if (changes.parameters && !changes.parameters.firstChange) {
        this.gridWrapperRef.instance.parameters = this.parameters;
      }
      if (changes.fetchXml && !changes.fetchXml.firstChange) {
        this.gridWrapperRef.instance.fetchXml = this.fetchXml;
      }
      if (changes.dashboardQueryName && !changes.dashboardQueryName.firstChange) {
        this.gridWrapperRef.instance.dashboardQueryName = this.dashboardQueryName;
      }
      if (changes.pagination && !changes.pagination.firstChange) {
        this.gridWrapperRef.instance.pagination = this.pagination;
      }
      if (changes.paginationPageSize && !changes.paginationPageSize.firstChange) {
        this.gridWrapperRef.instance.paginationPageSize = this.paginationPageSize;
      }
      if (changes.rowSelection && !changes.rowSelection.firstChange) {
        this.gridWrapperRef.instance.rowSelection = {
          mode: this.rowSelection,
          checkboxes: this.enableCheckboxSelection,
        };
      }
      if (changes.enableCheckboxSelection && !changes.enableCheckboxSelection.firstChange) {
        this.gridWrapperRef.instance.rowSelection = {
          mode: this.rowSelection,
          checkboxes: this.enableCheckboxSelection,
        };
      }
      if (changes.apiMetaData && !changes.apiMetaData.firstChange) {
        this.gridWrapperRef.instance.apiMetaData = this.apiMetaData;
      }
      if (changes.columnsVersion && !changes.columnsVersion.firstChange) {
        this.gridWrapperRef.instance.columnsVersion = this.columnsVersion;
      }
      // Pass customActions to ag-grid-wrapper instance
      if (changes.customActions && !changes.customActions.firstChange) {
        this.gridWrapperRef.instance.customActions = this.customActions;
      }
    }
  }

  private processColumnDefs(columnDefs: ColDef[]): ColDef[] {
    return columnDefs.map((colDef) => {
      if (colDef.columnType === 'actions') {
        const processedColDef = { ...colDef };

        // Set up the handleAction function for actions columns
        if (typeof processedColDef.columnParams === 'function') {
          const originalParams = processedColDef.columnParams;
          processedColDef.columnParams = (params: ICellParams) => {
            const result = originalParams(params);
            return {
              ...result,
              handleAction: (cellParams: ICellParams, action: any) => this.resolveAction(action, cellParams),
            };
          };
        } else {
          processedColDef.columnParams = {
            ...processedColDef.columnParams,
            handleAction: (params: ICellParams, action: any) => this.resolveAction(action, params),
          };
        }

        return processedColDef;
      }

      return colDef;
    });
  }

  private loadAgGridWrapper(): void {
    this.lazyLoaderService
      .loadComponent(LazyLoadComponents.AgGridWrapperComponent)
      .then((gridComponent) => {
        this.gridContainer.clear();
        this.gridWrapperRef = this.gridContainer.createComponent(gridComponent);
        this.gridWrapperRef.instance?.rowsSelected?.subscribe((selectedRows) => {
          this.rowSelected.emit(selectedRows);
        });

        this.gridWrapperRef.setInput('rowData', this.rowData);
        this.gridWrapperRef.setInput('columnDefs', this.processColumnDefs(this.columnDefs));
        this.gridWrapperRef.setInput('dashboardQuery', this.dashboardQuery);
        this.gridWrapperRef.setInput('parameters', this.parameters);
        this.gridWrapperRef.setInput('fetchXml', this.fetchXml);
        this.gridWrapperRef.setInput('dashboardQueryName', this.dashboardQueryName);
        this.gridWrapperRef.setInput('pagination', this.pagination);
        this.gridWrapperRef.setInput('paginationPageSize', this.paginationPageSize);
        this.gridWrapperRef.setInput('rowSelection', {
          mode: this.rowSelection,
          checkboxes: this.enableCheckboxSelection,
        });
        this.gridWrapperRef.setInput('apiMetaData', this.apiMetaData);
        this.gridWrapperRef.setInput('columnsVersion', this.columnsVersion);
        // Pass customActions to ag-grid-wrapper instance
        this.gridWrapperRef.setInput('customActions', this.customActions);
      })
      .catch((err) => {
        console.error('Error loading AgGridWrapperComponent:', err);
      });
  }

  resolveAction(action: any, params: ICellParams): void {
    if (action?.Link && params?.data) {
      const link = action.Link as Link;
      LinkService.resolveLinkObs(
        this.centraleService,
        this.sharedService,
        deepClone(link),
        params.data,
        this.actionLoader,
        null,
        null,
        null,
        this.version,
      ).subscribe(() => {});
    }
  }

  ngOnDestroy(): void {
    if (this.gridWrapperRef) {
      this.gridWrapperRef.destroy();
    }
  }
}
