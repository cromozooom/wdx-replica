# Feature Specification: SPX Magic Selector

**Feature Branch**: `001-spx-magic-selector`  
**Created**: February 14, 2026  
**Status**: Draft  
**Input**: User description: "SPX-Magik-Selector: Advanced lookup component with
ng-select dropdown and discovery modal for complex decision-making"

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Basic Selector Interaction (Priority: P1)

A user needs to quickly select a form or document using a searchable dropdown
interface, similar to standard ng-select components, but with enhanced lookup
capabilities.

**Why this priority**: This is the core entry point and provides immediate value
as a functional selector. Users can accomplish basic selection tasks without any
advanced features.

**Independent Test**: Can be fully tested by typing search terms in the
dropdown, selecting from filtered results, and verifying the selection is
captured correctly.

**Acceptance Scenarios**:

1. **Given** the SPX Magic Selector is displayed, **When** user clicks on the
   dropdown, **Then** a list of available forms/documents appears
2. **Given** the dropdown is open, **When** user types search terms, **Then**
   the list filters to show matching items
3. **Given** filtered results are shown, **When** user clicks on an item,
   **Then** the item is selected and dropdown closes
4. **Given** an item is selected, **When** user clears the selection, **Then**
   the dropdown returns to empty state

---

### User Story 2 - Contextual Preview Display (Priority: P2)

A user who has made a selection needs immediate visual confirmation of the
underlying data context including entity mapping, active query, and live record
count.

**Why this priority**: Provides essential feedback to prevent user confusion and
reduces need to open the full discovery modal for basic verification.

**Independent Test**: Can be tested by making a selection and verifying that the
preview container displays entity type, query description, and accurate record
count.

**Acceptance Scenarios**:

1. **Given** a form/document is selected, **When** the selection is confirmed,
   **Then** the preview container displays the associated entity type
2. **Given** the preview container is visible, **When** data is loaded, **Then**
   the active query description appears in human-readable format
3. **Given** query information is displayed, **When** the system calculates
   results, **Then** a live count badge shows the number of matching records
4. **Given** the preview container has data, **When** user changes selection,
   **Then** the preview updates to reflect the new selection

---

### User Story 3 - Advanced Discovery Modal (Priority: P3)

A user who needs to make complex decisions about data selection opens a
full-screen modal that displays all available form-entity-query combinations in
a comprehensive grid format.

**Why this priority**: Addresses complex use cases where users need to explore
multiple options and understand relationships between forms, entities, and
queries.

**Independent Test**: Can be tested by opening the discovery modal, browsing the
grid of options, and selecting a specific combination that gets applied to the
main selector.

**Acceptance Scenarios**:

1. **Given** the main selector is visible, **When** user clicks the advanced
   lookup trigger, **Then** a full-screen discovery modal opens
2. **Given** the discovery modal is open, **When** the grid loads, **Then** all
   form-entity-query combinations are displayed as individual rows
3. **Given** the grid shows multiple options, **When** user clicks on a row,
   **Then** that specific combination is selected with radio-button behavior
4. **Given** a row is selected, **When** user confirms the selection, **Then**
   the modal closes and the main selector updates
5. **Given** a row is selected in the modal, **When** user cancels or closes
   without confirming, **Then** the modal closes and the previous selection is
   retained (changes are discarded)

---

### User Story 4 - Live Data Inspection (Priority: P4)

A user browsing the discovery modal needs to see actual data preview and query
parameters to validate their selection before committing to it.

**Why this priority**: Prevents user errors by allowing validation of data
results before selection, reducing need for trial-and-error interactions.

**Independent Test**: Can be tested by clicking on grid rows, verifying that the
inspector panel shows query details and sample data, and confirming the preview
matches expectations.

**Acceptance Scenarios**:

1. **Given** the discovery modal is open and showing the grid, **When** user
   clicks on a row, **Then** an inspector panel displays query parameters in
   human-readable format
2. **Given** the inspector panel is visible, **When** query parameters are
   loaded, **Then** a preview of the first 5 matching records is shown
3. **Given** the data preview is displayed, **When** user examines the sample
   records, **Then** they can verify this matches their expected data set
4. **Given** the inspector shows satisfactory results, **When** user saves the
   selection, **Then** the modal closes and main selector reflects the choice

---

### Edge Cases

- What happens when no search results are found in the basic selector? (System
  displays "No results found" message and allows user to clear search or open
  discovery modal)
- How does the system handle network failures when loading preview data or
  record counts? (Show cached data with warning banner "Using cached data -
  network unavailable" and provide retry button)
- What occurs when a query returns zero results in the live data inspection?
  (Display "No records match this query" with query parameters still visible)
- How does the system behave with very large result sets (>10,000 records) in
  the preview? (Show first 5 records as specified, with notification "Showing 5
  of 10,000+ records")
- What happens when entity or query configurations change while the user has the
  modal open? (Continue showing current data until modal is closed/reopened or
  user manually refreshes)
- How does the system handle concurrent users modifying the underlying data
  while previews are being generated? (Use snapshot isolation - show data as of
  query execution time with timestamp)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a searchable ng-select dropdown component that
  displays available forms and documents
- **FR-002**: System MUST include an advanced lookup trigger (icon/button) that
  opens the discovery modal
- **FR-003**: System MUST display a contextual preview container beneath the
  selector showing entity mapping, active query, and live record count
- **FR-004**: System MUST update the preview container automatically when a
  selection is made
- **FR-005**: System MUST provide a full-screen discovery modal with
  comprehensive grid display
- **FR-006**: System MUST display form-entity-query combinations as flattened
  rows in the ag-grid (one row per query)
- **FR-007**: System MUST implement radio-button style selection ensuring only
  one combination can be selected
- **FR-008**: System MUST provide a live inspector panel that shows query
  parameters in human-readable format
- **FR-009**: System MUST display a preview of the first 5 records matching the
  selected query
- **FR-010**: System MUST support toggling between different business domains
  (CRM & Scheduling vs Document Management)
- **FR-011**: System MUST handle one-to-many relationships where one form can
  have multiple associated queries
- **FR-012**: System MUST synchronize the main selector with modal selections
  when changes are saved
- **FR-013**: System MUST provide real-time record counts that are exact for
  datasets under 1000 records and approximate (±10% accuracy) for larger
  datasets to maintain performance
- **FR-014**: System MUST allow users to verify data results before committing
  to selections
- **FR-015**: System MUST maintain query context when switching between the
  selector and discovery modal
- **FR-016**: System MUST display the same forms/documents to all users without
  user-specific permission filtering (permission system is out of scope for
  initial implementation)
- **FR-017**: System MUST display a "No matching queries found" message when
  switching domains if the current selection does not exist in the new domain,
  while keeping the selector interface active
- **FR-018**: System MUST display cached preview data with a warning banner when
  network failures occur, and provide a retry mechanism for refreshing data

### Key Entities _(include if feature involves data)_

- **Form/Document**: Primary selectable items with names and types, each
  associated with one or more queries
- **Entity**: Business objects that forms/documents relate to (Contact, Task,
  Legal Contract, Billing Record)
- **Query**: Specific data filters or views associated with forms, containing
  parameters and descriptions
- **Query Parameters**: Filter criteria and conditions that define how data is
  retrieved
- **Data Records**: The actual business data returned by queries, used for
  previews and counts
- **Domain Schema**: Configuration defining available entities and their
  relationships for different business contexts

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete basic form/document selection in under 10
  seconds using the dropdown interface
- **SC-002**: Advanced selections using the discovery modal can be completed in
  under 30 seconds
- **SC-003**: Preview container accurately displays entity mapping and query
  information within 2 seconds of selection
- **SC-004**: Live record counts update within 3 seconds and are accurate to
  actual query results (exact for <1000 records, ±10% for larger datasets)
- **SC-005**: Data preview in the inspector panel loads within 2 seconds and
  shows representative sample records
- **SC-006**: 90% of users can successfully validate their data selection using
  the preview before confirming
- **SC-007**: System supports switching between business domains without data
  corruption or interface errors
- **SC-008**: Grid can display and handle up to 100 form-query combinations
  without performance degradation
- **SC-009**: Modal interface maintains responsiveness with selection changes
  processed in under 1 second
- **SC-010**: User task completion rate improves by 40% compared to traditional
  dropdown-only interfaces

## Clarifications

### Session 2026-02-14

- Q: Should different users see different forms/documents based on permissions,
  or should all users see the same data? → A: All users see the same
  forms/queries initially, with permission filtering as a future enhancement
  (Option B)
- Q: What happens when a user opens the discovery modal, selects a different
  row, but then cancels or closes the modal without confirming? → A: Discard
  changes and keep previous selection (Option B)
- Q: What happens if a user switches domains and their current selection doesn't
  exist in the new domain? → A: Show message indicating "No matching queries
  found" but keep the modal open (Option C)
- Q: How should the system handle network failures when loading preview data or
  record counts? → A: Show cached data with warning banner, allow retry (Option
  B)
- Q: Should record counts be exact or approximate for large datasets? → A:
  Approximate counts (±10%) for datasets over 1000 records (Option B)
