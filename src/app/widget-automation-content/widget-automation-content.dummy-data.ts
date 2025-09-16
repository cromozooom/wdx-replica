import {
  AutomationItem,
  BreachListItem,
} from "./widget-automation-content.models";

export const widgetDemoAutomations: AutomationItem[] = [
  {
    id: "1",
    name: "Widget Validate Contacts",
    type: "form",
    breachList: [
      {
        id: "1",
        recordName: "Contact 1",
        type: "mine",
        outcome: "passed",
        errorMessage: "",
        details: "",
      },
      {
        id: "2",
        recordName: "Contact 2",
        type: "Teams",
        outcome: "review",
        errorMessage: "",
        details: "",
      },
    ],
    dateOfRun: "2023-03-15",
    status: "completed",
    breachListLink: "http://example.com/breach-list",
    testedRecordsCount: 100,
    passedRecordsCount: 80,
    failedRecordsCount: 20,
    failedRecordsWithErrorCount: 5,
  },
  {
    id: "2",
    name: "Widget Validate Documents",
    type: "document",
    breachList: [
      {
        id: "1",
        recordName: "Document 1",
        type: "mine",
        outcome: "passed",
        errorMessage: "",
        details: "",
      },
      {
        id: "2",
        recordName: "Document 2",
        type: "Teams",
        outcome: "review",
        errorMessage: "",
        details: "",
      },
    ],
    dateOfRun: "2023-03-15",
    status: "completed",
    breachListLink: "http://example.com/breach-list",
    testedRecordsCount: 100,
    passedRecordsCount: 80,
    failedRecordsCount: 20,
    failedRecordsWithErrorCount: 5,
  },
];
