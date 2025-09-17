import { AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

import { forkJoin, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DashboardQuery } from 'src/core/models/utils/dashboardquery';
import { DashboardWidgetContext } from 'src/core/modules/dashboard/components/dashboard-widget/dashboard-widget.context';
import { callTypes, CentraleService } from 'src/core/services/centrale.service';
import { ConfigService } from 'src/core/services/config/config.service';
import { HelperService } from 'src/core/services/helper.service';
import { Column, DictionaryItem, Entity } from 'src/libs/query-editor/src/lib/models/query-editor-models';
import { QueryEditorDeserialiserService } from 'src/libs/query-editor/src/lib/services/query-editor-deserialiser.service';
import { QueryEditorService } from 'src/libs/query-editor/src/lib/services/query-editor.service';
import { ApiMetaDataExtended, ColDef, DisplayParameter } from './portal-grid-wrapper.models';

@Component({
  standalone: false,
  selector: 'portal-grid-wrapper-editor',
  templateUrl: './portal-grid-wrapper-editor.component.html',
})
export class PortalGridWrapperEditorComponent implements AfterViewInit {
  @Input() configuration: any;
  @Input() isStudioMode: boolean = false;
  @Input() isPreviewSide: boolean;
  @ViewChild('queryEditorRef', { read: ViewContainerRef }) public queryEditorRef: any;

  public apiEndpoint: string = null;
  public allDashboardQueries: DashboardQuery[] = [];
  public allApis: ApiMetaDataExtended[] = [];
  public displayParameters: DisplayParameter[] = [];
  public parametersContainBraces: boolean = false;
  public availableColumns: Column[] = [];
  public editingColumn: ColDef = null;
  public creatingColumn: ColDef = null;
  public columnsVersion: number = 0;
  public columnsCopy: ColDef[] = [];
  private parameterChangeTimeout: any;
  public parameterErrors: string[] = [];
  public hasErrors: boolean = false;
  public updatingParameters: boolean = false;
  public showOptionalParameters: boolean = false;
  public optionalParametersPresent: boolean = false;
  public dataSourceApiDummyParameterValues: DictionaryItem[] = [];
  public dataSourceApiContainsBraces: boolean = false;
  public allDummyParametersPopulated: boolean = true;
  public dummyConfiguration: any;
  public error: string;
  public currentDataSourceApi: string;
  public loadingData: boolean = false;
  public apiProperties: any;
  public dataSourceApiProperties: any;
  public propertySelectionPath: string[] = [];
  public propertySelectionOptions: any[][] = [];
  public isSelectedPropertyObject: boolean = false;
  selectedQueryDetails: string = '';
  loggedInUserdId: string = '';
  cloneMode: boolean;
  isPersonalised: boolean = false;
  public entityOptions: Entity[] = [];
  public filteredDashboardQueries: DashboardQuery[] = [];
  private parser = new DOMParser();

  constructor(
    private environment: ConfigService,
    private centraleService: CentraleService,
    private deserialiserService: QueryEditorDeserialiserService,
    private context: DashboardWidgetContext,
    private service: QueryEditorService,
    private cdRef: ChangeDetectorRef,
  ) {
    this.loadEntityOptions();
    this.loadDashboardQueries();
    this.loadApiMetaData();
    this.loggedInUserdId = this.centraleService.userData.user.PersonId;
    if (!this.configuration) {
      this.configuration = this.context.getConfigForEdit();
    }
  }

  ngAfterViewInit() {
    forkJoin({
      entities: this.loadEntityOptions(),
      dashboardQueries: this.loadDashboardQueries(),
      apis: this.loadApiMetaData(),
    }).subscribe(() => {
      this.initializeConfiguration();
      this.cdRef.detectChanges();
    });
  }

  private loadEntityOptions(): Observable<Entity[]> {
    return this.service.getEntityOptions().pipe(
      tap((entities) => {
        this.entityOptions = entities;
        this.cdRef.detectChanges();
      }),
    );
  }

  private loadDashboardQueries(): Observable<DashboardQuery[]> {
    const apiBase = this.environment.getConfiguration().API_BASE;
    return this.centraleService
      .get<DashboardQuery[]>(`${apiBase}DashboardQuery/MyQueries`, callTypes.GET, { userId: this.loggedInUserdId }, null, true, false, null, false)
      .pipe(
        tap((queries) => {
          this.allDashboardQueries = queries;
          this.cdRef.detectChanges();
        }),
      );
  }

  private loadApiMetaData(): Observable<ApiMetaDataExtended[]> {
    const apiBase = this.environment.getConfiguration().API_BASE;
    return this.centraleService.get<ApiMetaDataExtended[]>(`${apiBase}Grids/VmApis`).pipe(
      tap((apis) => {
        this.allApis = apis;
      }),
    );
  }

  private filterDashboardQueries() {
    if (!this.configuration.EntityName) {
      if (this.configuration.DashboardQueryId) {
        const selectedQuery = this.allDashboardQueries.find((q) => (q as any).Id === this.configuration.DashboardQueryId) as any;
        this.configuration.EntityName = selectedQuery.EntityName;
        this.configuration.DashboardQuery = selectedQuery.Name;
      }
    }
    this.filteredDashboardQueries = [];
    if (this.configuration.EntityName) {
      this.filteredDashboardQueries = this.allDashboardQueries
        .filter((query) => {
          const entityName = query.EntityName;
          return entityName === this.configuration.EntityName;
        })
        .sort((a, b) => a.Name.localeCompare(b.Name));
    }
  }

  private extractEntityNameFromFetchXml(fetchXml: string): string | null {
    const xmlDoc = this.parser.parseFromString(fetchXml, 'text/xml');
    const entityNode = xmlDoc.getElementsByTagName('entity')[0];
    return entityNode?.getAttribute('name') || null;
  }

  private initializeConfiguration() {
    this.columnsCopy = this.configuration.Columns ? JSON.parse(JSON.stringify(this.configuration.Columns)) : null;
    if (this.configuration.Api) {
      this.apiEndpoint = this.configuration.Api.endpoint;
      const api = this.findMatchingApi();
      this.fetchApiProperties(api.Method, api.Endpoint).subscribe({});
      this.stringifyConfigurationParameterValues(api);
      this.checkForBracesInParameters();
    } else if (this.configuration.DashboardQueryId) {
      const selectedQuery = this.allDashboardQueries.find((q) => (q as any).Id === this.configuration.DashboardQueryId) as any;
      this.configuration.DashboardQuery = selectedQuery.Name;
      this.configuration.DataSourceType = 'dashboardQuery';
      this.loadDashboardQueryParameters(selectedQuery, false);
      this.stringifyConfigurationParameterValues();
      this.isPersonalised = selectedQuery.IsPersonalised;
      this.selectedQueryDetails = this.isPersonalised ? 'User Query Selected' : 'System Query Selected';
    } else if (this.configuration.FetchXml) {
      const fetchXml = this.configuration.FetchXml;
      if (fetchXml) {
        const query = { FetchXml: fetchXml };
        this.loadDashboardQueryParameters(query, false);
        this.stringifyConfigurationParameterValues();
      } else {
        this.displayParameters = [];
        this.availableColumns = [];
        this.configuration.Columns = [];
        this.columnsCopy = [];
      }
    }

    if (this.configuration.DataSource?.API) {
      this.fetchApiProperties(this.configuration.DataSource.APIType || 'GET', this.configuration.DataSource.API, true).subscribe({});
    } else {
      this.filterDashboardQueries();
    }

    this.parameterErrors = new Array(this.displayParameters.length).fill('');
  }

  public stringifyConfigurationParameterValues(api: any = null) {
    if (api !== null) {
      this.displayParameters = api.Parameters.map((param) => {
        const matchingParam = this.configuration.Parameters.find((p) => p.label === param.Name);
        return {
          label: param.isOptional ? `${param.Name} (Optional${param.DefaultValue !== undefined ? `, Default: ${param.DefaultValue}` : ''})` : param.Name,
          value: matchingParam?.value !== null ? JSON.stringify(matchingParam?.value) : null,
          isOptional: param.isOptional,
          isPropertySelectionMode: false,
          propertySelectionPath: [],
          propertySelectionOptions: [],
          isSelectedPropertyObject: false,
        };
      });
    } else {
      this.displayParameters = this.configuration.Parameters.map((param) => ({
        label: param.label,
        value: param.value !== null ? JSON.stringify(param.value) : null,
        isPropertySelectionMode: false,
        propertySelectionPath: [],
        propertySelectionOptions: [],
        isSelectedPropertyObject: false,
      }));
    }
    this.optionalParametersPresent = this.hasOptionalParameters();
  }

  public findMatchingApi(): ApiMetaDataExtended | undefined {
    return this.allApis.find(
      (api) =>
        api.Method === this.configuration.Api.method &&
        api.Endpoint === this.configuration.Api.endpoint &&
        api.Parameters.map((param) => param.Name)
          .sort()
          .join(',') === this.configuration.Api.parameters.sort().join(','),
    );
  }

  public onSwitchToPropertySelection(index: number) {
    const param = this.displayParameters[index];
    param.isPropertySelectionMode = true;
    param.propertySelectionPath = [null];
    param.propertySelectionOptions = [];
    let options = null;

    const currentValue = param.value;
    let initialPath: string[] = [];

    const regex = /^"?\{\{\s*([\w\.]+)\s*\}\}"?$/;
    const match = currentValue ? currentValue.match(regex) : null;
    if (match && match[1]) {
      const path = match[1];
      initialPath = path.split('.');
    } else {
      param.propertySelectionPath = [null];
    }

    if (this.configuration.DataSource.API) {
      if (!this.dataSourceApiProperties || this.configuration.DataSource.API !== this.currentDataSourceApi) {
        this.fetchApiProperties(this.configuration.DataSource.APIType || 'GET', this.configuration.DataSource.API, true).subscribe({
          next: () => {
            const validPath = this.validatePath(initialPath, this.dataSourceApiProperties);
            param.propertySelectionPath = validPath.length > 0 ? validPath : [null];

            this.onParameterPropertySelectedChange(index, validPath.length - 1);
          },
          error: () => {
            console.error('Error fetching API properties');
          },
        });
      } else {
        const validPath = this.validatePath(initialPath, this.dataSourceApiProperties);
        param.propertySelectionPath = validPath.length > 0 ? validPath : [null];
        this.onParameterPropertySelectedChange(index, validPath.length - 1);
      }
    } else {
      param.propertySelectionOptions.push(options);
    }
  }

  private validatePath(path: string[], dataSource: any): string[] {
    let currentObject = dataSource;
    const validPath: string[] = [];

    for (const key of path) {
      if (currentObject && currentObject.hasOwnProperty(key)) {
        validPath.push(key);
        currentObject = currentObject[key];
      } else {
        break;
      }
    }

    return validPath;
  }

  public onSwitchToManualInput(index: number) {
    const param = this.displayParameters[index];
    param.isPropertySelectionMode = false;
  }

  public onParameterPropertySelectedChange(index: number, level: number) {
    const param = this.displayParameters[index];

    param.propertySelectionPath = param.propertySelectionPath.slice(0, level + 1);
    param.propertySelectionOptions = [];
    for (let level = 0; level < param.propertySelectionPath.length; level++) {
      const options = this.getParameterPropertiesForLevel(index, level);
      param.propertySelectionOptions.push(options);
    }

    this.checkIsSelectedParameterPropertyObject(index, param.propertySelectionPath.length - 1);
    if (param.isSelectedPropertyObject) {
      const options = this.getParameterPropertiesForLevel(index, param.propertySelectionPath.length);
      param.propertySelectionOptions.push(options);
      param.propertySelectionPath.push(null);
    }

    this.updateParameterValueFromSelection(index);
    this.checkForBracesInParameters();
  }

  public onParameterPropertySelected(index: number, level: number) {
    this.updatingParameters = true;

    if (this.parameterChangeTimeout) {
      clearTimeout(this.parameterChangeTimeout);
    }

    this.parameterChangeTimeout = setTimeout(() => {
      this.onParameterPropertySelectedChange(index, level);
    }, 500);
  }

  public getParameterPropertiesForLevel(index: number, level: number): any[] {
    let currentObject = this.dataSourceApiProperties;
    const param = this.displayParameters[index];
    for (let i = 0; i < level; i++) {
      const prop = param.propertySelectionPath[i];
      currentObject = currentObject[prop];
      if (!currentObject) {
        return [];
      }
    }
    if (typeof currentObject !== 'object' || currentObject === null) {
      return [];
    }
    return Object.keys(currentObject).map((key) => ({
      label: key,
      isObject: typeof currentObject[key] === 'object' && currentObject[key] !== null,
    }));
  }

  public checkIsSelectedParameterPropertyObject(index: number, level: number) {
    let currentObject = this.dataSourceApiProperties;
    const param = this.displayParameters[index];
    for (let i = 0; i <= level; i++) {
      const prop = param.propertySelectionPath[i];
      currentObject = currentObject[prop];
      if (!currentObject) {
        param.isSelectedPropertyObject = false;
        return;
      }
    }
    param.isSelectedPropertyObject = typeof currentObject === 'object' && currentObject !== null;
  }

  public updateParameterValueFromSelection(index: number) {
    const param = this.displayParameters[index];
    const path = param.propertySelectionPath.filter((p) => p !== undefined && p !== null).join('.');
    if (path) {
      param.value = `"{{${path}}}"`;
    }

    this.configuration.Parameters[index].value = `{{${path}}}`;
  }

  public toggleParameterMode(index: number) {
    const param = this.displayParameters[index];
    if (param.isPropertySelectionMode) {
      this.onSwitchToManualInput(index);
    } else {
      this.onSwitchToPropertySelection(index);
    }
  }

  public onParameterInputChange(index: number, newValue: string) {
    this.updatingParameters = true;

    if (this.parameterChangeTimeout) {
      clearTimeout(this.parameterChangeTimeout);
    }

    this.parameterChangeTimeout = setTimeout(() => {
      this.onParameterChange(index, newValue);
    }, 500);
  }

  public onDummyParameterInputChange(paramLabel: string, value: string) {
    this.updatingParameters = true;

    if (this.parameterChangeTimeout) {
      clearTimeout(this.parameterChangeTimeout);
    }

    this.parameterChangeTimeout = setTimeout(() => {
      this.onDummyParameterChange(paramLabel, value);
    }, 500);
  }

  public onDataSourceTypeChange() {
    this.columnsVersion = 0;
    this.configuration.FetchXml = null;
    if (this.configuration.DataSourceType !== 'dashboardQuery') {
      this.configuration.DashboardQuery = null;
      this.configuration.DashboardQueryId = null;
    }
    this.configuration.Api = null;
    this.displayParameters = [];
    this.parametersContainBraces = false;
    this.availableColumns = [];
    this.configuration.Columns = [];
    this.columnsCopy = [];
    this.configuration.Parameters = [];
    this.apiEndpoint = null;
    this.parameterErrors = [];
    this.onCancelEdit();
  }

  public onFetchXmlChange() {
    this.columnsVersion = 0;
    this.configuration.Columns = [];
    this.columnsCopy = [];
    this.displayParameters = [];
    this.parametersContainBraces = false;
    this.availableColumns = [];
    this.configuration.Parameters = [];
    this.onCancelEdit();
    const fetchXml = this.configuration.FetchXml;
    if (fetchXml) {
      const query = { FetchXml: fetchXml };
      this.loadDashboardQueryParameters(query);
    } else {
      this.displayParameters = [];
      this.availableColumns = [];
      this.configuration.Columns = [];
      this.columnsCopy = [];
    }
  }

  public onSelectDashboardQuery(query: any) {
    if (!query) {
      console.warn('No query selected.');
      return;
    }

    if (typeof query === 'string') {
      query = this.allDashboardQueries.find((q) => q.Name === query);
    }

    this.columnsVersion = 0;
    this.configuration.DashboardQueryId = query.Id;
    this.configuration.DashboardQuery = query.Name;
    this.configuration.Columns = [];
    this.columnsCopy = [];
    this.displayParameters = [];
    this.parametersContainBraces = false;
    this.availableColumns = [];
    this.configuration.Parameters = [];
    this.onCancelEdit();
    this.loadDashboardQueryParameters(query);
    if (query.IsPersonalised) {
      this.isPersonalised = true;
      this.selectedQueryDetails = 'User Query Selected';
    } else {
      this.isPersonalised = false;
      this.selectedQueryDetails = 'System Query Selected';
    }
  }

  private fetchAttributeOptions(entityName: string, columnNames: string[]) {
    const apiBase = this.environment.getConfiguration().API_BASE;
    this.centraleService.get<any[]>(`${apiBase}DashboardQueryEditor/AttributeOptions/${entityName}`).subscribe(
      (attributeOptions) => {
        const filteredAttributes = columnNames.map((name) => attributeOptions.find((opt) => opt.schemaName === name)).filter((attr) => attr !== undefined);
        this.availableColumns = filteredAttributes.map((attr) => this.convertAttribute(attr, entityName));
      },
      (error) => {
        console.error('Error fetching attribute options:', error);
      },
    );
  }

  private convertAttribute(attributeOption: any, entityName: string): Column {
    return {
      attribute: {
        schemaName: attributeOption.schemaName,
        type: attributeOption.type,
        displayName: attributeOption.displayName,
      },
      entity: entityName,
    };
  }

  private loadDashboardQueryParameters(query: any, setParameters: boolean = true) {
    if (!query) {
      this.displayParameters = [];
      this.parameterErrors = [];
      return;
    }

    if (query) {
      this.centraleService.get(this.centraleService.ApiBase + 'DashboardQuery/GetByName', callTypes.GET, { name: query.Name }, null, true).subscribe({
        next: (dashboardQuery) => {
          this.deserialiserService.deserialise(dashboardQuery.FetchXml, query);

          this.displayParameters = JSON.parse(JSON.stringify(query.parameters)) || [];
          if (setParameters) {
            this.configuration.Parameters = JSON.parse(JSON.stringify(this.displayParameters));
          }
          const entityName = query.EntityName;
          const columnNames = query.columns?.map((col) => col.attribute?.schemaName) || [];
          this.checkForBracesInParameters();
          this.optionalParametersPresent = this.hasOptionalParameters();

          this.fetchAttributeOptions(entityName, columnNames);

          this.parameterErrors = new Array(this.displayParameters.length).fill('');
        },
        error: (err) => {
          console.error('Failed to retrieve dashboard query:', err);
        },
      });
    }
  }

  public onSelectApi(api: ApiMetaDataExtended) {
    this.columnsVersion = 0;
    this.configuration.Columns = [];
    this.columnsCopy = [];
    this.displayParameters = [];
    this.parametersContainBraces = false;
    this.availableColumns = [];
    this.configuration.Parameters = [];
    this.configuration.Api = { ...api, parameters: api.Parameters.map((param) => param.Name) };
    this.apiEndpoint = api.Endpoint;
    this.onCancelEdit();

    this.displayParameters = api.Parameters.map((param) => ({
      label: param.IsOptional ? `${param.Name} (Optional${param.DefaultValue !== undefined ? `, Default: ${param.DefaultValue}` : ''})` : param.Name,
      value: null,
      isOptional: param.IsOptional,
    }));

    this.configuration.Parameters = api.Parameters.map((param) => ({
      label: param.Name,
      value: null,
      isArray: param.IsArray,
    }));

    this.parameterErrors = new Array(this.displayParameters.length).fill('');

    this.checkForBracesInParameters();

    this.fetchApiProperties(api.Method, api.Endpoint).subscribe({});
    this.propertySelectionPath = [];
  }

  private fetchApiProperties(method: string, endpoint: string, dataSource: boolean = false): Observable<any> {
    const apiBase = this.environment.getConfiguration().API_BASE;
    const url = `${apiBase}Grids/VmApiProperties`;

    const params = { method, endpoint };

    return this.centraleService.get<any>(url, 0, params).pipe(
      tap(
        (properties) => {
          if (dataSource) {
            this.dataSourceApiProperties = properties;
            this.currentDataSourceApi = this.configuration.DataSource.API;
            this.extractParametersFromDataSourceApiEndpoint();
          } else {
            this.apiProperties = properties;
          }
        },
        (error) => {
          console.error('Error fetching API properties:', error);
          if (dataSource) {
            this.dataSourceApiProperties = null;
          } else {
            this.apiProperties = null;
          }
        },
      ),
    );
  }

  public onParameterChange(index: number, newValue: string) {
    try {
      if (newValue) {
        const parsedValue = JSON.parse(newValue);
        this.displayParameters[index].value = newValue;

        this.configuration.Parameters[index].value = parsedValue;
      } else {
        this.displayParameters[index].value = null;
        this.configuration.Parameters[index].value = null;
      }

      this.parameterErrors[index] = '';
    } catch (e) {
      this.configuration.Parameters[index].value = null;
      this.parameterErrors[index] = `Invalid JSON for parameter "${this.displayParameters[index].label}". Please enter a valid JSON value.`;
      this.displayParameters[index].value = newValue;
    }
    this.hasErrors = this.hasParameterErrors();
    this.updatingParameters = false;
    this.checkForBracesInParameters();
  }

  private hasParameterErrors(): boolean {
    return this.parameterErrors.some((error) => error && error.trim().length > 0);
  }

  private checkForBracesInParameters() {
    this.parametersContainBraces = this.displayParameters.some((param) => {
      if (typeof param.value === 'string') {
        return param.value.includes('{{') && param.value.includes('}}');
      }
      return false;
    });

    if (this.parametersContainBraces && this.configuration.DataSource.API) {
      if (this.currentDataSourceApi !== this.configuration.DataSource.API && this.dataSourceApiDummyParameterValues?.length == 0) {
        this.currentDataSourceApi = this.configuration.DataSource.API;
        this.extractParametersFromDataSourceApiEndpoint();
      } else if (this.allDummyParametersPopulated) {
        var apiEndPoint = this.getResolvedApiEndpoint();
        this.executeDataSourceApiEndpoint(apiEndPoint);
      }
    }
  }

  public onDummyParameterChange(paramLabel: string, value: string) {
    const param = this.dataSourceApiDummyParameterValues.find((p) => p.label === paramLabel);
    if (param) {
      param.value = value;
    }

    this.checkAllDummyParametersPopulated();

    if (this.allDummyParametersPopulated) {
      var apiEndPoint = this.getResolvedApiEndpoint();
      this.executeDataSourceApiEndpoint(apiEndPoint);
    }
  }

  private getResolvedApiEndpoint(): string {
    let endpoint = this.configuration.DataSource.API || '';
    for (var param of this.dataSourceApiDummyParameterValues) {
      var value = param.value || '';
      endpoint = endpoint.replace(`{${param.label}}`, value);
    }
    return endpoint;
  }

  private normalizeUrl(apiBase: string, endpoint: string): string {
    apiBase = apiBase.replace(/\/+$/, '');
    endpoint = endpoint.replace(/^\/+/, '');

    return `${apiBase}/${endpoint}`;
  }

  private executeDataSourceApiEndpoint(endpoint: string) {
    this.loadingData = true;

    const apiBase = this.environment.getConfiguration().API_BASE;

    const fullUrl = this.normalizeUrl(apiBase, endpoint);

    const callType = this.configuration.DataSource.APIType || 0;

    let params = { ...this.configuration.DataSource.QueryParameters };
    let body = { ...this.configuration.DataSource.BodyParameters };

    this.dataSourceApiDummyParameterValues.forEach((paramEntry) => {
      const key = paramEntry.label;
      if (params.hasOwnProperty(key)) {
        params[key] = paramEntry.value;
      }
    });

    for (const key in body) {
      const bodyValue = body[key];
      if (typeof bodyValue === 'string') {
        const regex = /{(\w+)}/g;
        let match;
        while ((match = regex.exec(bodyValue)) !== null) {
          const placeholder = match[1];
          const paramEntry = this.dataSourceApiDummyParameterValues.find((p) => p.label === placeholder);
          if (paramEntry) {
            body[key] = bodyValue.replace(`{${placeholder}}`, paramEntry.value);
          }
        }
      }
    }

    this.centraleService.get<any>(fullUrl, callType, params, body).subscribe(
      (data: any) => {
        this.updateDummyConfigurationWithData(data);
        this.updatingParameters = false;
        this.loadingData = false;
      },
      (error) => {
        this.dummyConfiguration = null;
        this.loadingData = false;
      },
    );
  }

  private updateDummyConfigurationWithData(data: any) {
    const dummyConfiguration = JSON.parse(JSON.stringify(this.configuration));

    dummyConfiguration.Parameters.forEach((param) => {
      if (param.isArray && typeof param.value === 'string') {
        const templateMatch = param.value.match(/{{\s*([^}]+)\s*}}/);

        if (templateMatch) {
          const propertyPath = templateMatch[1].trim();
          const parts = propertyPath.split('.');

          if (parts.length >= 2) {
            const parameterValues = parts[parts.length - 1];

            const parameterValuesArray = this.getPropertyByPath(data, parts.slice(0, -1).join('.'));
            if (Array.isArray(parameterValuesArray)) {
              const value = parameterValuesArray
                .map((item: any) => this.getPropertyByPath(item, parameterValues))
                .filter((value: any) => value !== undefined && value !== null);

              param.value = value;
              return;
            } else if (!parameterValuesArray) {
              param.value = [];
            }
          }
        }
      }
      const compiledValue = HelperService.compileTemplate(param.value, data);
      if (compiledValue) {
        param.value = compiledValue;
      }
    });

    this.dummyConfiguration = dummyConfiguration;
  }

  private getPropertyByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  public checkAllDummyParametersPopulated() {
    this.allDummyParametersPopulated = this.dataSourceApiDummyParameterValues.every(
      (param) => param.value !== null && param.value !== undefined && param.value.toString().trim() !== '',
    );
  }

  public getPropertiesForLevel(level: number): any[] {
    let currentObject = this.apiProperties;
    for (let i = 0; i < level; i++) {
      const prop = this.propertySelectionPath[i];
      currentObject = currentObject[prop];
      if (!currentObject) {
        return [];
      }
    }
    if (typeof currentObject !== 'object' || currentObject === null) {
      return [];
    }
    return Object.keys(currentObject).map((key) => ({
      label: key,
      isObject: typeof currentObject[key] === 'object' && currentObject[key] !== null,
    }));
  }

  public onPropertySelected(level: number) {
    this.propertySelectionPath = this.propertySelectionPath.slice(0, level + 1);

    this.propertySelectionOptions = [];
    for (let level = 0; level < this.propertySelectionPath.length; level++) {
      const options = this.getPropertiesForLevel(level);
      this.propertySelectionOptions.push(options);
    }

    this.checkIsSelectedPropertyObject(this.propertySelectionPath.length - 1);
    if (this.isSelectedPropertyObject) {
      const options = this.getPropertiesForLevel(this.propertySelectionPath.length);
      this.propertySelectionOptions.push(options);
      this.propertySelectionPath.push(null);
    }

    this.updateColumnField();
  }

  public updateColumnField() {
    const fieldPath = this.propertySelectionPath.join('.');
    if (this.creatingColumn) {
      this.creatingColumn.field = fieldPath;
    }
    if (this.editingColumn) {
      this.editingColumn.field = fieldPath;
    }
  }

  public checkIsSelectedPropertyObject(level: number) {
    let currentObject = this.apiProperties;
    for (let i = 0; i <= level; i++) {
      const prop = this.propertySelectionPath[i];
      currentObject = currentObject[prop];
      if (!currentObject) {
        this.isSelectedPropertyObject = false;
        return;
      }
    }
    this.isSelectedPropertyObject = typeof currentObject === 'object' && currentObject !== null;
  }

  public onAddColumn() {
    this.creatingColumn = { field: null, headerName: '' };
    if (this.configuration.DataSourceType === 'api') {
      this.propertySelectionPath = [null];

      this.propertySelectionOptions = [];
      const options = this.getPropertiesForLevel(0);
      this.propertySelectionOptions.push(options);
    }
  }

  public onDeleteColumn(column: ColDef) {
    this.columnsCopy = this.columnsCopy.filter((c) => c !== column);
    this.configuration.Columns = JSON.parse(JSON.stringify(this.columnsCopy));

    this.columnsVersion++;
  }

  public onSaveColumn() {
    if (this.creatingColumn) {
      this.columnsCopy.push(this.creatingColumn);
      this.creatingColumn = null;
    }
    if (this.editingColumn) {
      this.editingColumn = null;
    }
    this.configuration.Columns = JSON.parse(JSON.stringify(this.columnsCopy));
    this.columnsVersion++;
  }

  public onUpdateColumnMapping(column: ColDef, selectedColumn: any) {
    if (this.configuration.DataSourceType !== 'api') {
      column.field = selectedColumn.attribute.displayName;
      if (!column.headerName) {
        column.headerName = selectedColumn.attribute.displayName;
      }
    }
  }

  public onEditColumn(column: ColDef) {
    this.editingColumn = column;
    if (this.configuration.DataSourceType === 'api') {
      this.propertySelectionPath = column.field ? column.field.split('.') : [];

      this.propertySelectionOptions = [];
      for (let level = 0; level < this.propertySelectionPath.length; level++) {
        const options = this.getPropertiesForLevel(level);
        this.propertySelectionOptions.push(options);
      }
      this.checkIsSelectedPropertyObject(this.propertySelectionPath.length - 1);
      if (this.isSelectedPropertyObject) {
        const options = this.getPropertiesForLevel(this.propertySelectionPath.length);
        this.propertySelectionOptions.push(options);
        this.propertySelectionPath.push();
      }
    }
  }

  public onCancelEdit() {
    this.columnsCopy = JSON.parse(JSON.stringify(this.configuration.Columns));
    this.creatingColumn = null;
    this.editingColumn = null;
  }

  public toggleOptionalParameters() {
    this.showOptionalParameters = !this.showOptionalParameters;
  }

  public hasOptionalParameters(): boolean {
    return this.displayParameters.some((param) => param.isOptional);
  }

  private extractParametersFromDataSourceApiEndpoint(): void {
    const regex = /{(\w+)}/g;
    const params: DictionaryItem[] = [];
    let match;
    const endpoint = this.configuration.DataSource.API || '';
    while ((match = regex.exec(endpoint)) !== null) {
      params.push({ label: match[1], value: null });
    }

    const queryParameters = this.configuration.DataSource.QueryParameters || {};
    Object.keys(queryParameters).forEach((key) => {
      const value = queryParameters[key];
      if (typeof value === 'string') {
        while ((match = regex.exec(value)) !== null) {
          params.push({ label: key, value: null });
        }
      }
    });

    const bodyParameters = this.configuration.DataSource.BodyParameters || [];
    bodyParameters.forEach((param) => {
      if (typeof param === 'string') {
        while ((match = regex.exec(param)) !== null) {
          params.push({ label: match[1], value: null });
        }
      }
    });

    this.dataSourceApiDummyParameterValues = params;
    this.dataSourceApiContainsBraces = this.dataSourceApiDummyParameterValues.length > 0;
    this.allDummyParametersPopulated = !(this.dataSourceApiDummyParameterValues.length > 0);
  }

  public onSelectEntity(entity: any) {
    this.configuration.entityName = entity.schemaName;
    this.configuration.FetchName = null;
    this.configuration.DashboardQueryId = null;
    this.configuration.DashboardQuery = null;
    this.configuration.Parameters = [];
    this.stringifyConfigurationParameterValues();

    this.onSelectDashboardQuery(null);
    this.filterDashboardQueries();
  }
}
