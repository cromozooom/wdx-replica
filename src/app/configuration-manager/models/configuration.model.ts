import { ConfigurationType } from "./configuration-type.enum";
import { UpdateEntry } from "./update-entry.model";

export interface Configuration {
  id: number; // Unique numeric ID
  name: string;
  type: ConfigurationType;
  version: string; // Format: V#.#.#
  value: string; // JSON/FetchXML/text based on type
  updates: UpdateEntry[];
  createdDate: Date;
  createdBy: string;
  lastModifiedDate: Date;
  lastModifiedBy: string;
}
