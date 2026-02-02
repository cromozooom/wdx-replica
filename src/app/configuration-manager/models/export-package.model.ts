import { Configuration } from "./configuration.model";

export interface ExportPackage {
  configurations: Configuration[];
  exportDate: Date;
  exportedBy: string;
  version: string; // Export format version
}

export interface ExportFile {
  metadata: {
    id: number;
    name: string;
    type: string;
    version: string;
    updates: any[];
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  valueFileName: string; // Reference to the value file in ZIP
}
