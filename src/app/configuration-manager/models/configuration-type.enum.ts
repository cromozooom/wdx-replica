export enum ConfigurationType {
  DashboardConfig = "Dashboard config (JSON)",
  FormConfig = "Form config (JSON)",
  FetchXMLQuery = "Fetch XML queries (FetchXML)",
  DashboardQuery = "Dashboard queries (FetchXML)",
  Process = "Processes (JavaScript)",
  SystemSetting = "System Settings (JSON)",
}

export function getConfigurationFormat(
  type: ConfigurationType,
): "json" | "xml" | "text" {
  switch (type) {
    case ConfigurationType.DashboardConfig:
    case ConfigurationType.FormConfig:
    case ConfigurationType.SystemSetting:
      return "json";
    case ConfigurationType.FetchXMLQuery:
    case ConfigurationType.DashboardQuery:
      return "xml";
    case ConfigurationType.Process:
      return "text";
    default:
      return "text";
  }
}
