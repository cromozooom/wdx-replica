# Data Model: SPX Magic Selector

**Date**: February 14, 2026  
**Feature**: [spec.md](spec.md)  
**Research**: [research.md](research.md)

## Core Entities

### SelectionItem

**Purpose**: Primary selectable items (Forms/Documents) with associated query
relationships  
**Fields**:

- `id: string` - Unique identifier for the item
- `type: 'Form' | 'Document'` - Item classification
- `name: string` - Display name (e.g., "Appointment Form")
- `entityName: string` - Associated business entity (e.g., "Contact")
- `description?: string` - Optional detailed description
- `queries: Query[]` - Array of associated query definitions
- `metadata?: ItemMetadata` - Additional item properties

**Relationships**: One-to-many with Query entities  
**Validation Rules**:

- Name must be unique within type
- Must have at least one associated query
- EntityName must reference valid business entity

### Query

**Purpose**: Specific data filters/views associated with SelectionItem  
**Fields**:

- `id: string` - Unique identifier for the query
- `name: string` - Display name (e.g., "All Contacts")
- `description: string` - Human-readable explanation of filter logic
- `parameters: QueryParameters` - Filter criteria and conditions
- `previewData?: PreviewRecord[]` - Sample records for validation (max 5)
- `estimatedCount?: number` - Expected result count for performance planning

**Relationships**: Many-to-one with SelectionItem  
**Validation Rules**:

- Name must be unique within parent SelectionItem
- Parameters must be valid for associated entity type
- PreviewData limited to 5 records maximum

### QueryParameters

**Purpose**: Filter criteria and conditions that define data retrieval  
**Fields**:

- `filters: FilterCondition[]` - Array of filter criteria
- `sortBy?: SortDefinition` - Ordering specification
- `dateRange?: DateRangeFilter` - Time-based filtering
- `statusFilters?: string[]` - Status-based inclusion criteria
- `customMatchers?: CustomMatchCondition[]` - Advanced filtering logic

**State Transitions**: Immutable - modifications create new instances  
**Validation Rules**:

- All filter conditions must reference valid entity fields
- Date ranges must have valid start/end boundaries
- Custom matchers must have valid syntax

### FlatSelectionRow

**Purpose**: Flattened representation for ag-grid display (one row per query)  
**Fields**:

- `uniqueId: string` - Combination key: `${itemId}-${queryId}`
- `sourceName: string` - Item name for grid display
- `entityName: string` - Business entity for grid display
- `queryName: string` - Query name for grid display
- `queryDescription: string` - Query explanation for grid display
- `estimatedRecords: number` - Expected result count
- `queryRef: Query` - Reference to full query object
- `originalItem: SelectionItem` - Reference to parent item
- `isSelected?: boolean` - Grid selection state (radio button)

**Relationships**: References to SelectionItem and Query  
**Validation Rules**:

- UniqueId must be truly unique across entire dataset
- All reference objects must be valid and accessible

### PreviewRecord

**Purpose**: Sample data records for query validation and user confirmation  
**Fields**:

- `id: string | number` - Record identifier in source system
- `displayData: Record<string, any>` - Key-value pairs for preview display
- `metadata?: RecordMetadata` - Additional record properties for context
- `lastUpdated?: Date` - Timestamp for data freshness indication

**Validation Rules**:

- DisplayData must include at least primary identifier field
- Sensitive data must be masked or excluded from preview

### DomainSchema

**Purpose**: Configuration defining available entities and relationships for
business contexts  
**Fields**:

- `domainId: string` - Unique domain identifier (e.g., "crm-scheduling")
- `name: string` - Human-readable domain name
- `description: string` - Domain purpose and scope
- `entities: EntityDefinition[]` - Available business entities
- `defaultSelections?: SelectionItem[]` - Pre-configured common selections
- `isActive: boolean` - Whether domain is currently available

**State Transitions**:

- DRAFT → ACTIVE (when configuration complete)
- ACTIVE ↔ INACTIVE (for maintenance/updates)

**Validation Rules**:

- Domain must have at least one entity definition
- Entity definitions must include required field specifications

## Supporting Entities

### EntityDefinition

**Purpose**: Business entity specification within domain context  
**Fields**:

- `name: string` - Entity name (e.g., "Contact", "Task")
- `displayName: string` - User-friendly name
- `fields: FieldDefinition[]` - Available fields for querying
- `primaryKey: string` - Main identifier field name
- `relationships?: EntityRelationship[]` - Connections to other entities

### FilterCondition

**Purpose**: Individual filter criteria within QueryParameters  
**Fields**:

- `field: string` - Target field name
- `operator: FilterOperator` - Comparison type ('equals', 'contains',
  'greaterThan', etc.)
- `value: any` - Filter value
- `isActive: boolean` - Whether filter is currently applied

### ItemMetadata / RecordMetadata

**Purpose**: Extensible metadata containers for additional properties  
**Fields**:

- `createdDate?: Date` - Creation timestamp
- `lastModified?: Date` - Last update timestamp
- `tags?: string[]` - Classification tags
- `customProperties?: Record<string, any>` - Domain-specific attributes

## Data Flow Relationships

```
DomainSchema (1) → (many) EntityDefinition
SelectionItem (1) → (many) Query
Query (1) → (many) QueryParameters
Query (1) → (many) PreviewRecord
SelectionItem & Query → FlatSelectionRow (computed)
```

## State Management Considerations

### Immutable Patterns

- All entity modifications create new instances
- State changes flow through reactive streams
- History tracking for user interaction analysis

### Caching Strategy

- SelectionItem and Query definitions cached with TTL
- PreviewRecord data refreshed on each inspection
- Domain schemas cached until explicit refresh

### Performance Optimizations

- Lazy loading of PreviewRecord data
- Virtual scrolling support for large FlatSelectionRow collections
- Debounced search operations for real-time filtering

## Sample Data Structure

```typescript
// Example CRM domain configuration
const crmDomain: DomainSchema = {
  domainId: "crm-scheduling",
  name: "CRM & Scheduling",
  description: "Forms and documents for customer relationship management",
  entities: [
    {
      name: "Contact",
      displayName: "Contact Records",
      fields: [
        { name: "id", type: "string", required: true },
        { name: "name", type: "string", required: true },
        { name: "email", type: "string", required: false },
        { name: "status", type: "enum", values: ["Active", "Inactive"] },
      ],
      primaryKey: "id",
    },
  ],
  isActive: true,
};

const appointmentForm: SelectionItem = {
  id: "form-appointment",
  type: "Form",
  name: "Appointment Form",
  entityName: "Contact",
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
    },
  ],
};
```

This data model supports all functional requirements while maintaining clean
separation of concerns and enabling efficient state management patterns.
