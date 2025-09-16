export type StepStatus = "idle" | "ready" | "running";

export interface AutomationStep {
  id: string;
  kind: "trigger" | "action";
  icon: string;
  title: string;
  description: string;
  color: "success" | "primary" | "warning" | "info" | "secondary";
  status: StepStatus;
  actionType?: "select" | "validate" | "notify";
  source?: string;
  filter?: string;
  limit?: number;
  orderBy?: string;
  results?: PreviewRecord[];
  validationType?: "form" | "document";
  validationTarget?: string;
  message?: string;
  schedule?: string;
}

export interface AutomationItem {
  id: string;
  name: string;
  steps: AutomationStep[];
}

export interface PreviewRecord {
  id: string;
  name: string;
  status: "active" | "inactive";
  updated: string;
}
