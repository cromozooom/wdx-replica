// State interfaces for WidgetFormHistoryComponent
export type UserRole = "admin" | "default";
export interface User {
  id: string;
  name: string;
  role: UserRole;
  current: boolean;
}

export interface FormConfig {
  id: string;
  name: string;
  formConfig: any; // JSON schema/config
}

export interface FormHistoryEntry {
  id: string;
  formId: string;
  userId: string;
  timestamp: number;
  data: any;
  saveType: "automatic" | "button";
}
