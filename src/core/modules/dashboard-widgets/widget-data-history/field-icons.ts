// Field icon mapping and type enum for use in cell/group renderers
export enum FieldTypeIcon {
  RemoteWorkItemLink = "RemoteWorkItemLink",
  Link = "Link",
  Status = "Status",
  Assignee = "Assignee",
  TAApprovalDate = "TA Approval Date",
  TAApprovalStatus = "TA Approval Status",
  TAApprover = "TA Approver",
  TAComments = "TA Comment(s)",
  DAApprovalDate = "DA Approval Date",
  DAApprover = "DA Approver",
  DAApprovalStatus = "DA Approval Status",
  DAComments = "DA Comment(s)",
  DesignApproval = "Design Approval",
  Description = "Description",
}

export const FieldIconMap: Record<string, string> = {
  RemoteWorkItemLink: "fas fa-link",
  Link: "fas fa-link",
  Status: "fas fa-flag",
  Assignee: "fas fa-user",
  "TA Approval Date": "fas fa-calendar-check",
  "TA Approval Status": "fas fa-check-circle",
  "TA Approver": "fas fa-user-tie",
  "TA Comment(s)": "fas fa-comment-dots",
  "DA Approval Date": "fas fa-calendar-check",
  "DA Approver": "fas fa-user-tie",
  "DA Approval Status": "fas fa-check-circle",
  "DA Comment(s)": "fas fa-comment-dots",
  "Design Approval": "fas fa-drafting-compass",
  Description: "fas fa-align-left",
};
