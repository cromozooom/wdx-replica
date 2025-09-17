import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { themeAlpine } from 'ag-grid-community';
import { CentraleService, callTypes } from 'src/core/services/centrale.service';
import { ConfigService } from 'src/core/services/config/config.service';
import { DictionaryItem } from 'src/libs/entity-evaluator/src/lib/models/entity-evaluator-models';
import { QueryEditorDeserialiserService } from 'src/libs/query-editor/src/lib/services/query-editor-deserialiser.service';
import { QueryEditorService } from 'src/libs/query-editor/src/lib/services/query-editor.service';
import { ColumnTypeMappings } from './ag-grid-wrapper-custom-components';
import { RowSelection } from './ag-grid-wrapper-row-selection.component';
import { ApiMetaData, ColDef } from './models/ag-grid-wrapper-models';

@Component({
  standalone: false,
  selector: 'ag-grid-wrapper',
  templateUrl: './ag-grid-wrapper.component.html',
  host: {
    '[style.width]': '"100%"',
    '[style.height]': '"100%"',
    '[style.display]': '"flex"',
    '[style.flexDirection]': '"column"',
  },
})
export class AgGridWrapperComponent implements OnChanges, OnDestroy, OnInit {
  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() dashboardQuery: string;
  @Input() parameters: DictionaryItem[] = [];
  @Input() fetchXml: string;
  @Input() dashboardQueryName: string;
  @Input() pagination: boolean = true;
  @Input() isCancelState: boolean = false;
  @Input() paginationPageSize: number = 20;
  @Input() rowSelection?: RowSelection;
  @Input() apiMetaData: ApiMetaData;
  @Input() columnsVersion: number;
  @Input() customActions: Record<string, (params: any) => void>; // NEW: custom actions map
  @Output() rowsSelected: EventEmitter<any> = new EventEmitter<any>();

  public theme = themeAlpine; // use .withParams for setting properties like accentColor;

  public loadingData: boolean = true;
  private originalData: any[] = [];
  private originalHeaders: string[] = [];
  private originalValues: any[][] = [];
  private currentColumnVersion: number = 1;
  public error: string | null;
  private gridApi: any;

  defaultColDef: any = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  constructor(
    private service: QueryEditorService,
    private environment: ConfigService,
    private centraleService: CentraleService,
    private deserialiserService: QueryEditorDeserialiserService,
  ) {}

  ngOnInit() {
    this.ngOnChanges();
  }

  ngOnChanges() {
    if (this.columnDefs && this.columnDefs.length > 0) {
      this.processColumnDefs();
    }
    if (this.currentColumnVersion < this.columnsVersion) {
      this.currentColumnVersion = this.columnsVersion;
      this.onColumnsChanged();
    } else {
      this.loadingData = true;
      this.currentColumnVersion = this.columnsVersion;
      if (this.rowData && this.rowData.length > 0 && this.columnDefs && this.columnDefs.length > 0) {
        this.error = null;
        this.loadingData = false;
        return;
      } else if (this.fetchXml) {
        this.error = null;
        this.executeFetchXml(this.fetchXml);
      } else if (this.dashboardQueryName) {
        this.error = null;
        this.executeDashboardQuery();
      } else if (this.apiMetaData) {
        if (!this.columnDefs || this.columnDefs.length === 0) {
          this.error = 'No column definitions provided for API data. Please configure the columns to display the data correctly.';
          this.loadingData = false;
        } else {
          this.error = null;
        }
        this.executeApiEndpoint();
      } else {
        this.error = 'No data available to display.';
        this.loadingData = false;
      }
    }
  }

  ngOnDestroy() {
    if (this.gridApi) {
      this.gridApi.destroy();
    }
  }

  private processColumnDefs(): void {
    this.columnDefs = this.transformColumnDefs(this.columnDefs);
  }

  private transformColumnDefs(columnDefs: ColDef[]): ColDef[] {
    return columnDefs.map((colDef) => {
      const transformedColDef: any = { ...colDef };

      if (transformedColDef.columnType && ColumnTypeMappings[transformedColDef.columnType]) {
        transformedColDef.cellRenderer = ColumnTypeMappings[transformedColDef.columnType];
        // Merge cellRendererParams, columnParams, and inject customActions for link columns
        const params = transformedColDef.columnParams;
        if (typeof params === 'function') {
          // Pass the function directly for dynamic cellRendererParams per cell
          transformedColDef.cellRendererParams = params;
        } else {
          transformedColDef.cellRendererParams = {
            ...params,
            ...transformedColDef.cellRendererParams,
            ...(transformedColDef.columnType === 'link' ? { customActions: this.customActions } : {}),
          };
        }
        delete transformedColDef.columnType;
        delete transformedColDef.columnParams;
      } else if (transformedColDef.columnType && transformedColDef.columnType.toLowerCase() === 'date') {
        transformedColDef.valueFormatter = (params: any) => this.formatDate(params.value);
        transformedColDef.filter = 'agDateColumnFilter';
        transformedColDef.sortable = true;
        transformedColDef.comparator = this.dateComparator;
      }

      if (transformedColDef.children && transformedColDef.children.length > 0) {
        transformedColDef.children = this.transformColumnDefs(transformedColDef.children);
      }

      return transformedColDef;
    });
  }

  public onColumnsChanged() {
    if ((this.fetchXml || this.dashboardQueryName) && this.originalValues.length > 0) {
      this.transformDataFromFetchXml(this.originalHeaders, this.originalValues);
    } else if (this.apiMetaData && this.originalData.length > 0) {
      this.transformDataFromApi(this.originalData);
      if (!this.columnDefs || this.columnDefs.length === 0) {
        this.error = 'No column definitions provided for API data. Please configure the columns to display the data correctly.';
        this.loadingData = false;
      } else {
        this.error = null;
      }
    }
  }

  public onPaginationChanged(params) {
    if (params.newPage) {
    }
  }

  public onGridReady(params: any): void {
    this.gridApi = params.api; // Initialize gridApi
    this.gridApi.redrawRows(); // Redraw rows to ensure proper rendering
  }

  public onSelectionChanged(): void {
    if (!this.gridApi) {
      console.warn('Grid API is not initialized.');
      return;
    }
    const selectedRows = this.gridApi.getSelectedRows();
    this.rowsSelected.emit(selectedRows); // Emit the selected rows
  }

  private executeFetchXml(fetchXml: string) {
    const queryExpression = {
      parameters: this.parameters.map((param) => ({
        label: param.label,
        value: param.value,
      })),
    };

    try {
      this.service.executeQuery(fetchXml, queryExpression).subscribe(
        (results) => {
          if (results && results.headers && results.values) {
            this.transformDataFromFetchXml(results.headers as string[], results.values);
            this.loadingData = false;
          } else {
          }
        },
        (error) => {
          this.error = 'Error executing FetchXML query.';
          this.loadingData = false;
        },
      );
    } catch (error) {
      this.error = 'Error executing FetchXML query.';
      this.loadingData = false;
    }
  }

  private executeDashboardQuery() {
    this.centraleService
      .httpPost(
        this.environment.getConfiguration().API_BASE + '/DashboardQueryEditor/ExecuteFetchXmlByQueryName',
        { dashboardQueryName: this.dashboardQueryName },
        {
          parameters: this.parameters.map((parameter) => {
            const parameterKeyMatch = parameter.value?.match(/\{\{\s*([^{}]+?)\s*\}\}/);
            const parameterKey = parameterKeyMatch ? parameterKeyMatch[1] : undefined;
            return {
              label: parameter.label,
              value: parameterKey ? null : parameter.value,
            };
          }),
        },
      )
      .subscribe(
        (results) => {
          if (results && results.headers && results.values) {
            this.transformDataFromFetchXml(results.headers as string[], results.values);
            this.loadingData = false;
          } else {
          }
        },
        (err) => {
          this.error = 'Error fetching Dashboard Query.';
          this.loadingData = false;
        },
      );
  }

  private transformDataFromFetchXml(headers: string[], values: any[][]): void {
    this.originalHeaders = headers;
    this.originalValues = values;

    if (!this.columnDefs || this.columnDefs.length === 0) {
      this.columnDefs = headers.map((header) => ({
        field: header,
        headerName: header,
      }));
    }

    const headerIndexMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerIndexMap.set(header, index);
    });

    this.rowData = values.map((rowArray) => {
      const rowObject: any = {};

      this.columnDefs.forEach((colDef) => {
        const field = colDef.field;
        const index = headerIndexMap.get(field);

        if (index !== undefined) {
          rowObject[field] = rowArray[index];
        } else {
          rowObject[field] = null;
        }
      });

      return rowObject;
    });
  }

  private executeApiEndpoint() {
    const apiBase = this.environment.getConfiguration().API_BASE;
    let endpoint = this.apiMetaData.endpoint;
    const method = this.apiMetaData.method || 'GET';

    const urlParamNames = this.getUrlParameterNames(endpoint);

    const params = {};
    let body = null;

    this.parameters.forEach((param) => {
      if (param.value !== null) {
        if (urlParamNames.includes(param.label)) {
          const placeholder = `{${param.label}}`;
          endpoint = endpoint.replace(placeholder, encodeURIComponent(param.value));
        } else {
          if (this.apiMetaData.bodyParameter && param.label === this.apiMetaData.bodyParameter) {
            body = param.value;
          } else {
            params[param.label] = param.value;
          }
        }
      }
    });

    const fullUrl = this.normalizeUrl(apiBase, endpoint);

    const callType = method === 'POST' ? callTypes.POST : callTypes.GET;

    this.centraleService.get<any>(fullUrl, callType, params, body).subscribe(
      (data: any) => {
        if (data) {
          this.transformDataFromApi(data);
          this.loadingData = false;
        } else {
          this.error = 'No data returned from API.';
          this.loadingData = false;
        }
      },
      (error) => {
        this.error = 'Error fetching data from API endpoint.';
        this.loadingData = false;
      },
    );
  }

  private getUrlParameterNames(url: string): string[] {
    const regex = /{([^}]+)}/g;
    const matches: any[] = [];
    let match;
    while ((match = regex.exec(url)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  private normalizeUrl(apiBase: string, endpoint: string): string {
    apiBase = apiBase.replace(/\/+$/, '');
    endpoint = endpoint.replace(/^\/+/, '');

    return `${apiBase}/${endpoint}`;
  }

  private transformDataFromApi(data: any[]): void {
    this.originalData = data;

    if (data.length === 0) {
      this.rowData = [];
      this.error = 'No data available to display.';
      return;
    }

    this.rowData = data;
  }

  private dateComparator(date1: string, date2: string) {
    return new Date(date1).getTime() - new Date(date2).getTime();
  }

  private formatDate(dateString: string) {
    if (!dateString) {
      return 'No date';
    }
    return this.environment.stringToDate(dateString);
  }
}
