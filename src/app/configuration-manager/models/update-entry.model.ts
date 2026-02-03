export interface UpdateEntry {
  jiraTicket?: string; // Optional, format: WPO-#####
  comment?: string; // Markdown, mandatory if jiraTicket is empty
  date: Date;
  madeBy: string; // Full name from predefined list
  previousValue?: string; // The value before this update (for diff viewing)
}
