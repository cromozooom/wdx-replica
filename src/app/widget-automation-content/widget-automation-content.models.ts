export interface BreachListItem {
  id: string;
  recordName: string;
  type: "mine" | "Teams";
  outcome: "passed" | "review" | "error";
  errorMessage?: string;
  details?: string;
}
export interface AutomationItem {
  id: string;
  name: string;
  type: "form" | "document";
  // details about the validation (breach list)
  breachList: BreachListItem[];
  dateOfRun: string;
  status: "running" | "completed" | "failed";
  breachListLink?: string; // link to download the breach list
  testedRecordsCount?: number;
  passedRecordsCount?: number;
  failedRecordsCount?: number;
  failedRecordsWithErrorCount?: number;
}

export interface PreviewRecord {
  id: string;
  name: string;
  status: "active" | "inactive";
  updated: string;
}
