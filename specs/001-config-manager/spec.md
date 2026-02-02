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

### User Story 4 - Export Configurations as ZIP (Priority: P2)

A user needs to export one or multiple configurations as a ZIP archive for
backup or sharing with other team members or environments.

**Why this priority**: Export functionality enables backup, version control
integration, and deployment workflows. Critical for production readiness.

**Independent Test**: User can select multiple configurations from the grid
(using checkboxes), click "Export", and receive a ZIP file download containing
all selected configurations with their metadata in a structured format.

**Acceptance Scenarios**:

1. **Given** user has selected one configuration, **When** user clicks "Export",
   **Then** browser downloads a ZIP file named "[config-name]-[timestamp].zip"
2. **Given** user has selected multiple configurations, **When** user clicks
   "Export", **Then** ZIP file contains separate files for each configuration
3. **Given** configurations are exported, **When** user extracts ZIP, **Then**
   each configuration has a JSON file with metadata and a separate file for the
   value (JSON/FetchXML/text)
4. **Given** no configurations are selected, **When** user clicks "Export",
   **Then** error message prompts user to select at least one configuration (via
   ng-bootstrap toast)
5. **Given** user clicks "Export All", **When** button is clicked, **Then** all
   configurations in current filtered view are exported

---

### User Story 5 - Import Configurations with Conflict Detection (Priority: P3)

A user needs to import a ZIP archive containing configurations and be notified
if any imported configurations conflict with existing ones, with the ability to
compare and choose which version to keep.

**Why this priority**: Import with conflict detection prevents accidental
overwrites and data loss. Essential for team collaboration and environment
synchronization.

**Independent Test**: User can drag-and-drop or select a ZIP file, upload it,
see a conflict detection report showing which configurations already exist, view
side-by-side comparison of metadata and values, and choose to skip, overwrite,
or rename conflicting configurations.

**Acceptance Scenarios**:

1. **Given** user uploads a ZIP with new configurations, **When** import
   completes, **Then** all new configurations are added to the system
2. **Given** user uploads a ZIP with a configuration that has the same ID as
   existing one, **When** import analyzes the file, **Then** conflict detection
   screen appears
3. **Given** conflict is detected, **When** user views comparison, **Then**
   side-by-side view shows: metadata differences (name, version, updates) and
   value differences (with diff highlighting)
4. **Given** user is viewing conflicts, **When** user chooses "Overwrite",
   **Then** existing configuration is replaced with imported one
5. **Given** user is viewing conflicts, **When** user chooses "Keep Existing",
   **Then** imported configuration is discarded
6. **Given** user is viewing conflicts, **When** user chooses "Import as New",
   **Then** imported configuration is saved with a new auto-generated ID
7. **Given** ZIP contains invalid files, **When** import is attempted, **Then**
   validation errors are displayed via ng-bootstrap toast listing specific
   issues

---

### Edge Cases

- What happens when a user tries to import a ZIP file with corrupted or invalid
  JSON/FetchXML content?
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

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support six configuration types: Dashboard config
  (JSON), Form config (JSON), Fetch XML queries (FetchXML), Dashboard queries
  (FetchXML), Processes (JSON), and System Settings (JSON)
- **FR-002**: System MUST provide JSON editor for JSON-type configurations with
  syntax validation
- **FR-003**: System MUST provide Ace editor with FetchXML syntax highlighting
  for FetchXML-type configurations
- **FR-004**: System MUST provide text editor for simple text format
  configurations
- **FR-005**: System MUST validate configuration content based on type before
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
  conflicts: Overwrite, Keep Existing, or Import as New (with new ID)
- **FR-021**: System MUST validate imported ZIP file structure and content
  before processing
- **FR-022**: System MUST provide clear error messages for invalid imports with
  specific validation failures
- **FR-023**: System MUST auto-generate unique numeric IDs for new
  configurations
- **FR-024**: System MUST persist all configurations and metadata to browser
  storage (IndexedDB preferred for large datasets, localStorage as fallback)
- **FR-025**: System MUST support version string format validation (V#.#.#
  where # is numeric)
- **FR-026**: System MUST implement storage abstraction layer to enable future
  migration to REST API backend without UI changes
- **FR-027**: System MUST use last-write-wins strategy for concurrent edits
  within same browser (across tabs); no cross-browser coordination required
- **FR-028**: System MUST display error messages and notifications using
  ng-bootstrap Toast component
- **FR-029**: System MUST show loading indicators during async operations (save,
  export, import) to prevent unintended user actions

### Key Entities

- **Configuration**: Represents a stored configuration with metadata and content
  value
  - Attributes: ID (unique numeric), Name (string), Type (enum: Dashboard
    Config, Form Config, Fetch XML Query, Dashboard Query, Process, System
    Setting), Version (string V#.#.#), Value (JSON/FetchXML/text based on type),
    Updates (array), Created Date, Created By, Last Modified Date, Last Modified
    By
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
    maintains directory structure for easy re-import

- **Team Member**: Represents a user who can create/modify configurations
  - Attributes: Full Name (for "Made By" dropdown)

## Success Criteria _(mandatory)_

### Measurable Outcomes

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
- **SC-008**: Configuration content validation catches 100% of invalid JSON and
  FetchXML before save
- **SC-009**: Update history captures all changes with complete audit trail
  (who, when, why)
- **SC-010**: Users can find any configuration using search/filter in under 10
  seconds

## Assumptions

- AG-Grid Enterprise license is already available and can be used
- Existing JSON editor library (likely jsoneditor from package.json) can be used
- Ace editor library (ace-builds from package.json) is available for FetchXML
  editing
- Browser supports modern File API for ZIP creation/extraction
- Browser supports IndexedDB (with localStorage fallback for older browsers)
- Team member names list is maintained elsewhere and provided via API or
  configuration
- ZIP file size limits are reasonable (<100MB per export) for browser handling
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
  comparison)
