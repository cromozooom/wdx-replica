import { SelectionItem } from "../models/selection-item.interface";
import { DomainSchema } from "../models/domain-schema.interface";

/**
 * Mock data constants for SPX Magic Selector
 * Two domains: CRM & Scheduling, Document Management
 */

// ========================================
// DOMAIN: CRM & Scheduling
// ========================================

export const CRM_DOMAIN: DomainSchema = {
  domainId: "crm-scheduling",
  name: "CRM & Scheduling",
  description: "Forms and documents for customer relationship management",
  isActive: true,
  entities: [
    {
      name: "Contact",
      displayName: "Contact Records",
      primaryKey: "id",
      fields: [
        { name: "id", type: "string", required: true },
        { name: "name", type: "string", required: true },
        { name: "email", type: "string", required: false },
        {
          name: "status",
          type: "enum",
          required: true,
          values: ["Active", "Inactive"],
        },
        { name: "createdDate", type: "date", required: true },
      ],
    },
    {
      name: "Task",
      displayName: "Task Records",
      primaryKey: "id",
      fields: [
        { name: "id", type: "string", required: true },
        { name: "title", type: "string", required: true },
        {
          name: "status",
          type: "enum",
          required: true,
          values: ["Open", "InProgress", "Completed"],
        },
        { name: "dueDate", type: "date", required: false },
      ],
    },
  ],
};

export const CRM_SELECTION_ITEMS: SelectionItem[] = [
  {
    id: "form-appointment",
    type: "Form",
    name: "Appointment Form",
    entityName: "Contact",
    description: "Schedule appointments with customers",
    queries: [
      {
        id: "query-all-contacts",
        name: "All Contacts",
        description: "Returns every person in the database",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Active",
              isActive: true,
            },
          ],
        },
        estimatedCount: 2500,
        previewData: [
          {
            id: "c1",
            displayData: {
              name: "John Smith",
              email: "john@example.com",
              status: "Active",
            },
          },
          {
            id: "c2",
            displayData: {
              name: "Jane Doe",
              email: "jane@example.com",
              status: "Active",
            },
          },
          {
            id: "c3",
            displayData: {
              name: "Bob Johnson",
              email: "bob@example.com",
              status: "Active",
            },
          },
        ],
      },
      {
        id: "query-recent-leads",
        name: "Recent Leads",
        description: "Only contacts created in the last 30 days",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Active",
              isActive: true,
            },
          ],
          dateRange: {
            field: "createdDate",
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        estimatedCount: 150,
        previewData: [
          {
            id: "c10",
            displayData: {
              name: "Alice Cooper",
              email: "alice@example.com",
              status: "Active",
            },
          },
          {
            id: "c11",
            displayData: {
              name: "Charlie Brown",
              email: "charlie@example.com",
              status: "Active",
            },
          },
        ],
      },
      {
        id: "query-inactive-contacts",
        name: "Inactive Contacts",
        description: "Contacts marked as inactive",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Inactive",
              isActive: true,
            },
          ],
        },
        estimatedCount: 320,
      },
    ],
  },
  {
    id: "form-task-assignment",
    type: "Form",
    name: "Task Assignment Form",
    entityName: "Task",
    description: "Assign tasks to team members",
    queries: [
      {
        id: "query-open-tasks",
        name: "Open Tasks",
        description: "All tasks with status = Open",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Open",
              isActive: true,
            },
          ],
        },
        estimatedCount: 85,
        previewData: [
          {
            id: "t1",
            displayData: { title: "Follow up with client", status: "Open" },
          },
          {
            id: "t2",
            displayData: { title: "Review proposal", status: "Open" },
          },
        ],
      },
      {
        id: "query-overdue-tasks",
        name: "Overdue Tasks",
        description: "Tasks past their due date",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "in",
              value: ["Open", "InProgress"],
              isActive: true,
            },
          ],
          dateRange: {
            field: "dueDate",
            start: new Date(0),
            end: new Date(),
          },
        },
        estimatedCount: 12,
      },
    ],
  },
  {
    id: "doc-contact-report",
    type: "Document",
    name: "Contact Report",
    entityName: "Contact",
    description: "Generate contact activity reports",
    queries: [
      {
        id: "query-vip-contacts",
        name: "VIP Contacts",
        description: "High-value customer contacts",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Active",
              isActive: true,
            },
          ],
          customMatchers: [
            {
              matcherId: "vip-flag",
              expression: "metadata.vipStatus === true",
            },
          ],
        },
        estimatedCount: 45,
      },
    ],
  },
];

// ========================================
// DOMAIN: Document Management
// ========================================

export const DOCUMENT_DOMAIN: DomainSchema = {
  domainId: "document-management",
  name: "Document Management",
  description: "Document templates and file management",
  isActive: true,
  entities: [
    {
      name: "Invoice",
      displayName: "Invoice Records",
      primaryKey: "id",
      fields: [
        { name: "id", type: "string", required: true },
        { name: "invoiceNumber", type: "string", required: true },
        { name: "amount", type: "number", required: true },
        {
          name: "status",
          type: "enum",
          required: true,
          values: ["Draft", "Sent", "Paid", "Overdue"],
        },
        { name: "issueDate", type: "date", required: true },
      ],
    },
    {
      name: "Contract",
      displayName: "Contract Documents",
      primaryKey: "id",
      fields: [
        { name: "id", type: "string", required: true },
        { name: "title", type: "string", required: true },
        {
          name: "status",
          type: "enum",
          required: true,
          values: ["Draft", "Review", "Active", "Expired"],
        },
        { name: "expiryDate", type: "date", required: false },
      ],
    },
  ],
};

export const DOCUMENT_SELECTION_ITEMS: SelectionItem[] = [
  {
    id: "doc-invoice-template",
    type: "Document",
    name: "Invoice Template",
    entityName: "Invoice",
    description: "Standard invoice document template",
    queries: [
      {
        id: "query-unpaid-invoices",
        name: "Unpaid Invoices",
        description: "Invoices with status = Sent or Overdue",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "in",
              value: ["Sent", "Overdue"],
              isActive: true,
            },
          ],
        },
        estimatedCount: 67,
        previewData: [
          {
            id: "i1",
            displayData: {
              invoiceNumber: "INV-2024-001",
              amount: 1500,
              status: "Sent",
            },
          },
          {
            id: "i2",
            displayData: {
              invoiceNumber: "INV-2024-002",
              amount: 2300,
              status: "Overdue",
            },
          },
        ],
      },
      {
        id: "query-paid-invoices",
        name: "Paid Invoices",
        description: "All paid invoices",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Paid",
              isActive: true,
            },
          ],
        },
        estimatedCount: 1230,
      },
      {
        id: "query-high-value-invoices",
        name: "High-Value Invoices",
        description: "Invoices over $5000",
        parameters: {
          filters: [
            {
              field: "amount",
              operator: "greaterThan",
              value: 5000,
              isActive: true,
            },
          ],
        },
        estimatedCount: 42,
      },
    ],
  },
  {
    id: "doc-contract-template",
    type: "Document",
    name: "Contract Template",
    entityName: "Contract",
    description: "Standard service contract template",
    queries: [
      {
        id: "query-active-contracts",
        name: "Active Contracts",
        description: "Currently active service contracts",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Active",
              isActive: true,
            },
          ],
        },
        estimatedCount: 156,
        previewData: [
          {
            id: "ct1",
            displayData: {
              title: "Service Agreement - ABC Corp",
              status: "Active",
            },
          },
          {
            id: "ct2",
            displayData: {
              title: "Maintenance Contract - XYZ Ltd",
              status: "Active",
            },
          },
        ],
      },
      {
        id: "query-expiring-contracts",
        name: "Expiring Soon",
        description: "Contracts expiring in next 90 days",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Active",
              isActive: true,
            },
          ],
          dateRange: {
            field: "expiryDate",
            start: new Date(),
            end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        estimatedCount: 23,
      },
    ],
  },
  {
    id: "form-contract-review",
    type: "Form",
    name: "Contract Review Form",
    entityName: "Contract",
    description: "Internal contract review workflow",
    queries: [
      {
        id: "query-pending-review",
        name: "Pending Review",
        description: "Contracts awaiting legal review",
        parameters: {
          filters: [
            {
              field: "status",
              operator: "equals",
              value: "Review",
              isActive: true,
            },
          ],
        },
        estimatedCount: 8,
      },
    ],
  },
];

// ========================================
// EXPORT ALL DOMAINS AND ITEMS
// ========================================

export const ALL_DOMAINS: DomainSchema[] = [CRM_DOMAIN, DOCUMENT_DOMAIN];

export const ALL_SELECTION_ITEMS_BY_DOMAIN: Record<string, SelectionItem[]> = {
  [CRM_DOMAIN.domainId]: CRM_SELECTION_ITEMS,
  [DOCUMENT_DOMAIN.domainId]: DOCUMENT_SELECTION_ITEMS,
};
