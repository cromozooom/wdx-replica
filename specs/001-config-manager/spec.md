# Feature Specification: Configuration Manager

**Feature Branch**: `001-config-manager`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Multi-format configuration management system with
import/export, versioning, and comparison capabilities"

## Clarifications

### Session 2026-02-02

- Q: Storage backend and data persistence strategy → A: LocalStorage/IndexedDB
  with future API migration path
- Q: Concurrent editing conflict resolution → A: Last-write-wins with
  browser-level only (no server coordination)
- Q: Error and loading state UX patterns → A: ng-bootstrap Toast

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Edit Configuration (Priority: P1)

A user needs to create a new configuration (Dashboard config, Form config, Fetch
XML query, Dashboard query, Process, or System Setting) and edit its content
using an appropriate editor based on the format.

**Why this priority**: Core functionality - without the ability to create and
edit configurations, no other features can be tested. This is the foundation of
the entire system.

**Independent Test**: User can navigate to the configuration manager, click "New
Configuration", select a type (e.g., "Dashboard config"), enter metadata (name,
version), edit the JSON content in the JSON editor, save it, and see it appear
in the grid. The configuration persists after browser refresh.

**Acceptance Scenarios**:

1. **Given** user is on the configuration manager page, **When** user clicks
   "New Configuration" and selects "Dashboard config (JSON)", **Then** a JSON
   editor opens with default template
2. **Given** user has a JSON editor open, **When** user enters configuration
   name "Main Dashboard", version "V1.0.0", and valid JSON content, **Then**
   configuration is saved successfully
3. **Given** user selects a FetchXML configuration type, **When** user opens the
   editor, **Then** Ace editor opens with FetchXML syntax highlighting
4. **Given** user has edited a configuration, **When** user saves changes,
   **Then** configuration appears in the AG-Grid with all metadata visible

---

### User Story 2 - Track Configuration Versions and Updates (Priority: P1)

A user needs to document changes to configurations over time with update history
including Jira references, comments, dates, and authors.

**Why this priority**: Version tracking is critical for compliance, auditing,
and team collaboration. Without it, users cannot track who changed what and
when, leading to confusion and potential errors.

**Independent Test**: User can edit an existing configuration, add an update
entry with Jira ticket "WPO-12344", markdown comment "Fixed dashboard layout
issue", date, and author name from a dropdown. The update history is saved and
displays in chronological order.

**Acceptance Scenarios**:

1. **Given** user is editing a configuration, **When** user adds an update with
   Jira "WPO-12344" and date, **Then** update is saved in the updates array
2. **Given** user is adding an update without Jira ticket, **When** user
   provides a markdown comment, **Then** update is saved successfully (comment
   is mandatory when Jira is missing)
3. **Given** user tries to save update without Jira or comment, **When** user
   clicks save, **Then** validation error appears via ng-bootstrap toast
   requiring at least one field
4. **Given** configuration has multiple updates, **When** user views update
   history, **Then** updates display in chronological order with all details
   (Jira, comment, date, author)
5. **Given** user is adding an update, **When** user selects "Made by" field,
   **Then** dropdown shows predefined list of team member names

---

### User Story 3 - View and Filter Configurations in Grid (Priority: P2)

A user needs to view all configurations in an AG-Grid with the ability to filter
by category, search by name, and sort by version or date.

**Why this priority**: Grid display provides overview and quick access to
configurations. Essential for managing large numbers of configurations
efficiently.

**Independent Test**: User can view all configurations in AG-Grid Enterprise,
filter by "Dashboard config" category, search for configuration by name, sort by
version number, and select a row to open the editor.

**Acceptance Scenarios**:

1. **Given** user has created multiple configurations, **When** user opens
   configuration manager, **Then** all configurations display in AG-Grid with
   columns: Name, Type, Version, Last Updated, Updated By
2. **Given** configurations are displayed, **When** user applies category filter
   "Form config (JSON)", **Then** only Form configurations are shown
3. **Given** user types in search box, **When** user enters "Dashboard",
   **Then** grid filters to show only configurations with "Dashboard" in the
   name
4. **Given** grid is displaying configurations, **When** user clicks on version
   column header, **Then** configurations sort by version (semantic versioning
   order)
5. **Given** user double-clicks a row, **When** row is selected, **Then** editor
   opens with that configuration loaded

---

### User Story 4 - Manage Configuration Baskets/Environments (Priority: P1)

A user needs to organize configurations into baskets (e.g., "Product (core)",
"UAT", "Staging") to simulate different environments and manage configuration
sets independently.

**Why this priority**: Basket system enables environment simulation and
organized configuration management. Essential for managing different deployment
scenarios and testing environments.

**Independent Test**: User can create a new basket named "UAT", select multiple
configurations from the grid using checkboxes, add them to the "UAT" basket,
switch between baskets to view different configuration sets, and see the basket
name displayed in the UI header.

**Acceptance Scenarios**:

1. **Given** user is on the configuration manager page, **When** user clicks
   "Create Basket", **Then** a modal opens prompting for basket name
2. **Given** user enters basket name "UAT", **When** user clicks save, **Then**
   new basket is created and appears in basket dropdown
3. **Given** user has multiple baskets, **When** user selects a basket from
   dropdown, **Then** grid displays only configurations belonging to that basket
4. **Given** user selects configurations using grid checkboxes, **When** user
   clicks "Add to Basket" and selects "UAT", **Then** selected configurations
   are added to UAT basket
5. **Given** user switches baskets, **When** user navigates between "Product
   (core)" and "UAT", **Then** different configuration sets are displayed
6. **Given** system initializes, **When** no baskets exist, **Then** default
   "Product (core)" basket is created automatically
7. **Given** user has baskets created, **When** user views basket list, **Then**
   each basket shows configuration count

---

### User Story 5 - Export Configurations from Basket with Selection (Priority: P2)

A user needs to export selected configurations from a specific basket as a ZIP
archive, with the ability to choose which configurations to include using
checkboxes.

**Why this priority**: Export functionality enables backup, version control
integration, and deployment workflows. Checkbox selection provides granular
control over what gets exported.

**Independent Test**: User can select a basket (e.g., "UAT"), use grid
checkboxes to select specific configurations, click "Export Selected", and
receive a ZIP file download containing only the checked configurations with
their metadata and basket information.

**Acceptance Scenarios**:

1. **Given** user has checked one configuration in grid, **When** user clicks
   "Export Selected", **Then** browser downloads a ZIP file named
   "[basket-name]-[config-name]-[timestamp].zip"
2. **Given** user has checked multiple configurations, **When** user clicks
   "Export Selected", **Then** ZIP file contains separate files for each
   selected configuration
3. **Given** configurations are exported, **When** user extracts ZIP, **Then**
   each configuration has metadata JSON including basket assignment
4. **Given** no configurations are checked, **When** user clicks "Export
   Selected", **Then** error message prompts user to select at least one
   configuration (via ng-bootstrap toast)
5. **Given** user clicks "Export Basket", **When** button is clicked, **Then**
   all configurations in current active basket are exported
6. **Given** user has filtered grid view, **When** user selects visible
   configurations and exports, **Then** only checked configurations are included
   regardless of filter
7. **Given** export completes, **When** user opens ZIP, **Then** package
   includes manifest file listing basket name and all included configurations

---

### User Story 6 - Import Configurations to Basket with Conflict Detection (Priority: P3)

A user needs to import a ZIP archive containing configurations into a specific
basket and be notified if any imported configurations conflict with existing
ones, with the ability to compare and choose which version to keep and which
basket to assign.

**Why this priority**: Import with conflict detection prevents accidental
overwrites and data loss. Basket assignment during import enables proper
environment organization.

**Independent Test**: User can select target basket "UAT", drag-and-drop or
select a ZIP file, upload it, see a conflict detection report showing which
configurations already exist, view side-by-side comparison of metadata and
values, choose resolution (skip/overwrite/new), and confirm basket assignment.

**Acceptance Scenarios**:

1. **Given** user uploads a ZIP with new configurations, **When** import
   completes, **Then** all new configurations are added to the system
2. **Given** user uploads a ZIP with a configuration that has the same ID as
   existing one, **When** import analyzes the file, **Then** conflict detection
   screen appears
3. **Given** conflict is detected, **When** user views comparison, **Then**
   side-by-side view shows: metadata differences (name, version, updates) and
   value differencselects basket "UAT" and uploads a ZIP with new
   configurations, **When** import completes, **Then** all new configurations
   are added to "UAT" basket
4. **Given** user uploads a ZIP with a configuration that has the same ID as
   existing one, **When** import analyzes the file, **Then** conflict detection
   screen appears
5. **Given** conflict is detected, **When** user views comparison, **Then**
   side-by-side view shows: metadata differences (name, version, updates), value
   differences (with diff highlighting), and basket assignment
6. **Given** user is viewing conflicts, **When** user chooses "Overwrite",
   **Then** existing configuration is replaced with imported one and moved to
   target basket
7. **Given** user is viewing conflicts, **When** user chooses "Keep Existing",
   **Then** imported configuration is discarded and existing one remains in
   original basket
8. **Given** user is viewing conflicts, **When** user chooses "Import as New",
   **Then** imported configuration is saved with new auto-generated ID and added
   to target basket
9. **Given** ZIP contains basket manifest, **When** import is processed,
   **Then** configurations are automatically assigned to baskets specified in
   manifest (with user confirmation)
10. **Given** ZIP contains invalid files, **When** import is attempted, **Then**
    validation errors are displayed via ng-bootstrap toast listing specific
    issues
11. **Given** user imports without selecting target basket, **When** import
    starts, **Then** system prompts user to select or create target baskettchXML
    content?

- How does the system handle configurations with very large content (>10MB)?
- If user edits same configuration in multiple browser tabs simultaneously, last
  save wins (browser-level storage coordination only; no cross-browser conflict
  detection)
- How does the system handle invalid version strings (not matching V#.#.#
  format)?
- What happens when Ace editor or JSON editor libraries fail to load?
- How does the system handle special characters in configuration names or
  filenames?
- What happens if the user's browser doesn't support ZIP file
  creation/extraction?
- How does the system handle configurations with circular references in JSON?
- What happens when importing a ZIP with duplicate configuration IDs within the
  same ZIP? JSON/FetchXML content?
- How does the system handle configurations with very large content (>10MB)?
- If user edits same configuration in multiple browser tabs simultaneously, last
  save wins (browser-level storage coordination only; no cross-browser conflict
  detection)
- How does the system handle invalid version strings (not matching V#.#.#
  format)?
- What happens when Ace editor or JSON editor libraries fail to load?
- How does the system handle special characters in configuration names or
  filenames?
- What happens if the user's browser doesn't support ZIP file
  creation/extraction?
- How does the system handle configurations with circular references in JSON?
- What happens when importing a ZIP with duplicate configuration IDs within the
  same ZIP?
- What happens when user tries to delete a basket that contains configurations?
- How does the system handle moving configurations between baskets?
- What happens if user tries to create a basket with duplicate name?
- How does the system handle basket selection state when switching between
  pages?
- What happens when user selects configurations from multiple baskets and tries
  to export?
- How does the system handle partial import failures (some configs succeed, some
  fail)?
- What happens if imported ZIP contains basket names that don't exist
  locally\*\*: System MUST validate configuration content based on type before
  saving (valid JSON, valid FetchXML, etc.)
- **FR-006**: System MUST store metadata for each configuration: Name (string),
  ID (numeric), Version (string format V#.#.#)
- **FR-007**: System MUST maintain an updates array for each configuration with
  fields: Jira ticket (optional, format WPO-#####), Comment (markdown, mandatory
  if Jira is empty), Date (date), Made By (full name from predefined list)
- **FR-008**: System MUST enforce validation that either Jira ticket OR Comment
  is provided for each update entry
- **FR-009**: System MUST display configurations in AG-Grid Enterprise with
  columns: ID, Name, Type, Version, Last Update Date, Last Updated By
- **FR-010**: System MUST support grid filtering by configuration type/category
- **FR-011**: System MUST support grid searching by configuration name
- **FR-012**: System MUST support grid sorting by any column (name, version,
  date, etc.)
- **FR-013**: System MUST allow single or multiple selection of configurations
  for export
- **FR-014**: System MUST export selected configurations as a ZIP archive
  containing structured files
- **FR-015**: System MUST include both metadata and value content in exported
  ZIP files
- **FR-016**: System MUST support importing ZIP archives created by the export
  functionality
- **FR-017**: System MUST detect conflicts when imported configuration ID
  matches an existing configuration ID
- **FR-018**: System MUST provide side-by-side comparison view showing
  differences in metadata and value content
- **FR-019**: System MUST highlight differences between conflicting
  configurations (metadata fields and content diff)
- **FR-020**: System MUST allow users to choose resolution strategy for
  conflicts: Overwrite, Kesupport creating, viewing, and selecting baskets
  (configuration environments)
- **FR-014**: System MUST auto-create default "Product (core)" basket on first
  use
- **FR-015**: System MUST allow users to assign configurations to baskets
- **FR-016**: System MUST filter grid to show only configurations in selected
  basket
- **FR-017**: System MUST provide checkboxes in grid for selecting individual
  configurations
- **FR-018**: System MUST allow export of checked configurations only (selective
  export)
- **FR-019**: System MUST allow export of entire basket (all configurations in
  active basket)
- **FR-020**: System MUST export selected configurations as a ZIP archive
  containing structured files
- **FR-021**: System MUST include basket information in exported ZIP
  metadata/manifest
- **FR-022**: System MUST include both metadata and value content in exported
  ZIP files
- **FR-023**: System MUST support importing ZIP archives created by the export
  functionality
- **FR-024**: System MUST prompt user to select target basket for import
- **FR-025**: System MUST detect conflicts when imported configuration ID
  matches an existing configuration ID
- **FR-026**: System MUST provide side-by-side comparison view showing
  differences in metadata and value content
- **FR-027**: System MUST highlight differences between conflicting
  configurations (metadata fields and content diff)
- **FR-028**: System MUST allow users to choose resolution strategy for
  conflicts: Overwrite, Keep Existing, or Import as New (with new ID)
- **FR-029**: System MUST support basket assignment during import (including
  basket creation if needed)
- **FR-030**: System MUST validate imported ZIP file structure and content
  before processing
- **FR-031**: System MUST provide clear error messages for invalid imports with
  specific validation failures
- **FR-032**: System MUST prevent deletion of baskets containing configurations
  (require empty basket or force flag)

### Key Entities

- **Configuration**: Represents a stored configuration with metadata and content
  value
  - Attributes: ID (unique numeric), Name (string), Type (enum: Dashboard
    Config, Form Config, Fetch XML Query, Dashboard Query, Process, System
    Setting), Version (string V#.#.#), Value (JSON/FetchXML/text based on type),
    Updates (array), Created Date, Created By, Last Modified Date, Last Modified
    By
- **Update Entry**: Represents a single update/change to a configuration

  - Basket\*\*: Represents an environment or configuration set (e.g., "Product
    (core)", "UAT", "Staging")
  - Attributes: ID (unique numeric), Name (string, unique), Configuration IDs
    (array of references), Created Date, Created By, Last Modified Date, Last
    Modified By

- **Configuration**: Represents a stored configuration with metadata and content
  value

  - Attributes: ID (unique numeric), Name (string), Type (enum: Dashboard
    Config, Form Config, Fetch XML Query, Dashboard Query, Process, System
    Setting), Version (string V#.#.#), Value (JSON/FetchXML/text based on type),
    Updates (array), Basket Assignment (reference to Basket ID), Created Date,
    Created By, Last Modified Date, Last Modified By

- **Update Entry**: Represents a single update/change to a configuration

  - Attributes: Jira Ticket (optional string, format WPO-#####), Comment
    (markdown string, mandatory if Jira empty), Date (date), Made By (string -
    full name)

- **Configuration Type**: Categorizes configurations by purpose and format

  - Types: Dashboard config (JSON), Form config (JSON), Fetch XML queries
    (FetchXML), Dashboard queries (FetchXML), Processes (JSON), System Settings
    (JSON)

- **Export Package**: ZIP archive containing exported configurations
  - Structure: Contains metadata files and value files for each configuration,
    basket manifest file with assignments,
- **SC-001**: Users can create a new configuration and save it in under 1 minute
- **SC-002**: Users can export and import a set of 10 configurations in under 30
  seconds total
- **SC-003**: System displays grid with 100+ configurations without noticeable
  lag (<2 seconds load time)
- **SC-004**: Conflict detection identifies all matching IDs with 100% accuracy
- **SC-005**: Side-by-side comparison view clearly highlights all differences
  between configurations
- **SC-006**: 95% of users can successfully complete import workflow on first
  attempt without training
- **SC-007**: Zero data loss during export/import operations (all metadata and
  content preserved exactly)
- **SC-008**: Configuration content vbasket and add configurations to it in
  under 1 minute
- **SC-002**: Users can create a new configuration and save it in under 1 minute
- **SC-003**: Users can select configurations via checkboxes and export them in
  under 30 seconds
- **SC-004**: Users can export and import a set of 10 configurations between
  baskets in under 30 seconds total
- **SC-005**: System displays grid with 100+ configurations without noticeable
  lag (<2 seconds load time)
- **SC-006**: Basket switching updates grid view in under 1 second
- **SC-007**: Conflict detection identifies all matching IDs with 100% accuracy
- **SC-008**: Side-by-side comparison view clearly highlights all differences
  between configurations
- **SC-009**: 95% of users can successfully complete import workflow with basket
  assignment on first attempt without training
- **SC-010**: Zero data loss during export/import operations (all metadata,
  content, and basket assignments preserved exactly)
- **SC-011**: Configuration content validation catches 100% of invalid JSON and
  FetchXML before save
- **SC-012**: Update history captures all changes with complete audit trail
  (who, when, why)
- **SC-013**: Users can find any configuration using search/filter in under 10
  seconds
- **SC-014**: Checkbox selection state persists correctly during filtering and
  sorting operationle size limits are reasonable (<100MB per export) for browser
  handling
- FetchXML validation rules are defined (or simple XML validation is sufficient)
- System has authentication/authorization (user identity for "Created By", "Made
  By" fields)
- Storage is client-side (browser-based) in initial implementation; future
  migration to REST API backend is planned but out of current scope
- Existing project infrastructure supports file downloads and uploads

## Out of Scope

- Version control system integration (Git, SVN, etc.)
- Real-time collaborative editing of configurations
- Automated testing of configuration values
- Configuration deployment automation
- Role-based access control for different configuration types
- Configuration dependencies or relationships
- Configuration templates or wizards
- Scheduled automatic backups
- Cloud storage integration
- Configuration migration tools between environments
- Diff-based merging of conflicting configurations (only side-by-side
  comparison) to actual environments
- Role-based access control for different configuration types or baskets
- Configuration dependencies or relationships tracking
- Configuration templates or wizards
- Scheduled automatic backups
- Cloud storage integration
- Automated configuration migration tools between environments
- Diff-based merging of conflicting configurations (only side-by-side
  comparison)
- Basket sharing or collaboration features
- Basket access permissions or visibility controls
- Configuration locking or checkout mechanisms
- Bulk basket operations (merge baskets, copy basket, etc.)
- Basket version history or snapshots
