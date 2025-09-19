export interface ApiMetaData {
  Method: 'GET' | 'POST';
  Endpoint: string;
  BodyParameter?: string;
  Parameters: string[];
}

export interface ApiParameterExtended {
  Name: string;
  IsOptional: boolean;
  DefaultValue?: any;
  IsArray: boolean;
}

export interface ApiMetaDataExtended {
  Method: 'GET' | 'POST';
  Endpoint: string;
  BodyParameter?: string;
  Parameters: ApiParameterExtended[];
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

export interface ICellParams {
  colDef: ColDef;
  data: any;
  value: any;
}

type BaseColDef = {
  field?: string;
  headerName: string;
  width?: number;
  children?: ColDef[];
  hide?: boolean;
};

type OrFunction<T> = T | ((params: ICellParams) => T);

type LinkColDef = BaseColDef & {
  columnType: 'link';
  columnParams: OrFunction<{
    urlTemplate?: string;
    handleNavigate?: (params: ICellParams) => void;
    actionKey?: string; // NEW: key to look up a custom action
  }>;
};

type CopyPasteColDef = BaseColDef & {
  columnType: 'copyPaste';
  columnParams: OrFunction<{
    handleCopy?: (id: string) => void;
    getIsPasteMode?: () => boolean;
    toggleSelected?: (id: string, isSelected: boolean) => void;
    getCopiedId?: () => string;
  }>;
};

type IconColDef = BaseColDef & {
  columnType: 'icon';
  columnParams: OrFunction<{
    text: string;
    iconClass: string;
  }>;
};

type ActionsColDef = BaseColDef & {
  columnType: 'actions';
  columnParams: OrFunction<{
    actions?: ActionConfig[];
    handleAction?: (params: ICellParams, action: any) => void;
  }>;
};

type ActionConfig = {
  Name: string;
  Icon: string;
  Enabled: boolean;
  Link: any;
};

type StringColDef = BaseColDef & {
  columnType: 'string';
  columnParams?: undefined;
};

type NumberColDef = BaseColDef & {
  columnType: 'number';
  columnParams?: undefined;
};

type BooleanColDef = BaseColDef & {
  columnType: 'boolean';
  columnParams?: undefined;
};

type DateColDef = BaseColDef & {
  columnType: 'date';
  columnParams?: undefined;
};

type DefaultColDef = BaseColDef & {
  columnType?: undefined;
  columnParams?: undefined;
};

export type ColDef = LinkColDef | CopyPasteColDef | IconColDef | ActionsColDef | StringColDef | NumberColDef | BooleanColDef | DateColDef | DefaultColDef;
