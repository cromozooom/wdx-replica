export interface ApiMetaData {
  method: 'GET' | 'POST';
  endpoint: string;
  bodyParameter?: string;
  parameters: string[];
}

export interface ApiParameterExtended {
  name: string;
  isOptional: boolean;
  defaultValue?: any;
  isArray: boolean;
}

export interface ApiMetaDataExtended {
  method: 'GET' | 'POST';
  endpoint: string;
  bodyParameter?: string;
  parameters: ApiParameterExtended[];
}

export interface RowSelection {
  mode: 'singleRow' | 'multiRow' | 'none' | null;
}

export interface DisplayParameter {
  label: string;
  value: string | null;
  isOptional?: boolean;
  isPropertySelectionMode?: boolean;
  propertySelectionPath?: string[];
  propertySelectionOptions?: any[][];
  isSelectedPropertyObject?: boolean;
}

export interface ColDef {
  field: string;
  headerName: string;
}
