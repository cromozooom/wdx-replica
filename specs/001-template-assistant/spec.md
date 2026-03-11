# Feature Specification: Intelligent Template Assistant

**Feature Branch**: `001-template-assistant`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "As a Senior Analyst, I want to draft official
reports where customer data is automatically filled in, so that I avoid manual
typing errors and maintain the Bank's professional standards."

## Clarifications

### Session 2026-03-10

- Q: When a data field is inserted but the customer record has no value for that
  field (e.g., Date of Birth is empty), what should appear in the merged
  document? → A: Display a standard placeholder like "(Not Available)" or blank
  space
- Q: Once an analyst saves a document template, how do they access and select it
  for reuse with different customers? → A: use localStorage and then
  download/upload to system file
- Q: The spec mentions "Date of Birth" as a data field. When this date is merged
  into the document, what format should it use? → A: Configurable per field with
  sensible defaults (e.g., "10 March 2026")
- Q: When an analyst opens a new Smart Document to create a template, must they
  have a customer already selected in the system, or can they create templates
  without any customer context? → A: No customer required; preview uses sample
  data
- Q: When an analyst makes changes to a document (typing text, inserting fields,
  deleting content), should the system support standard undo/redo functionality?
  → A: Full undo/redo support for all operations
- Q: How many customer data fields should the system support, and what does
  "1,000+ available fields" mean in User Story 4? → A: 20-30 data field keys
  (like `name`, `date`, `account_number`) with the system handling 1,000+
  customer records (rows) in AG-Grid. The "1,000+ fields" reference means the
  Variable Search Menu shows available field keys to choose from, while AG-Grid
  displays 1,000+ customer records where each record has those same 20-30 field
  keys
- Q: When an analyst uses arrow keys to navigate and crosses a pill boundary,
  what should happen to allow both quick pill replacement AND normal text
  navigation? → A: Visual highlight only - Pill highlights when cursor is
  adjacent, Variable Selector menu appears only if user clicks the highlighted
  pill or types a trigger character while highlighted. Arrow keys alone just
  navigate and highlight without blocking movement.
- Q: When an analyst pastes text containing the trigger character sequence `{{`,
  how should the system behave? → A: Paste as literal text - Trigger characters
  are inserted as plain text without triggering pill creation menus. Analyst
  must manually convert text to pills if needed by deleting and re-inserting via
  the trigger menu.
- Q: When a customer data value is very long and threatens to break document
  layout, how should the preview and final document handle it? → A: Wrap text
  naturally to multiple lines like normal word processor text, maintaining all
  content. Final output will be converted to plain HTML with minimal styling for
  email sending, so standard text wrapping is appropriate.
- Q: When and how should an analyst name and save a template they've created? →
  A: Save button with prompt - Analyst clicks "Save Template" button, system
  prompts for name. Auto-save drafts in background to prevent data loss from
  accidental closure, while manual save gives control over what gets persisted
  with a meaningful name.
- Q: What is the complete list of data fields for the initial release beyond the
  minimum 3 (Full Name, Date of Birth, Sort Code)? → A: Use wealth management
  domain fields (Account Number, Account Balance, Account Type, Portfolio Value,
  Investment Advisor Name, Client Since Date, Risk Profile, Annual Income, Net
  Worth, Primary Contact Phone, Primary Contact Email, Mailing Address, City,
  Postal Code, Country, Client Status, Last Review Date, Next Review Date,
  Preferred Contact Method, Tax ID) - approximately 20-30 total fields loaded
  from JSON sample data file.
- Q: What styling should be used for HTML email export? → A: Plain unstyled HTML
  that relies on email client defaults. Long content should wrap naturally
  without max-width constraints.
- Q: Should CustomerDataService integrate with AG-Grid in MVP or use sample
  data? → A: Use sample data from JSON file (same wealth management data used
  for field definitions) for MVP. AG-Grid integration deferred to post-MVP.
- Q: Should field format configuration have a UI in MVP? → A: No configuration
  UI. Use hardcoded sensible defaults only (dates: "10 March 2026" format,
  currency: "$1,234.56" format, etc.).
- Q: When user clicks Save Template while auto-save draft exists, what happens?
  → A: Prompt for name, save as new named template, keep auto-save draft
  separate (don't delete draft).
- Q: When user loads a named template and edits it, should auto-save update the
  original or create new draft? → A: Auto-save creates new draft, preserves
  original template (prevents accidental overwrites).
- Q: Is multi-database support in scope for initial release? → A: No, single
  data source assumed for MVP. Document in Assumptions section.
- Q: Which trigger character has precedence if multiple are configured? → A:
  Only `{{` is the trigger character (not `[`). Single trigger eliminates
  precedence issues.

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

### User Story 1 - Create Document with Data Field Insertion (Priority: P1)

An Analyst opens a new Smart Document and creates a professional report by
typing regular text and inserting customer data fields through an intuitive
menu. The Analyst types the trigger character `{{` to bring up a menu of
available data fields (Full Name, Date of Birth, Sort Code, etc.), selects a
field, and continues typing. The document contains both static text and data
placeholders that will be filled in for each customer.

**Why this priority**: This is the core value proposition - enabling analysts to
create reusable templates with embedded data fields. Without this, there is no
feature. It delivers immediate value by allowing analysts to avoid retyping
customer data manually.

**Independent Test**: Can be fully tested by creating a new document, typing
text, inserting at least one data field via the trigger character menu, and
verifying the field appears in the document. Delivers a working template that
can be reused.

**Acceptance Scenarios**:

1. **Given** the Analyst opens a new Smart Document, **When** they start typing
   regular text, **Then** the text appears on a clean white page similar to a
   simplified word processor
2. **Given** the Analyst is typing in a document, **When** they type a trigger
   character (`[` or `{{`), **Then** a menu appears at the cursor showing
   available data fields
3. **Given** the data field menu is displayed, **When** the Analyst selects
   "Full Name" from the menu, **Then** a data field placeholder for Full Name is
   inserted into the document
4. **Given** the Analyst has inserted a data field, **When** they continue
   typing after the field, **Then** they can add more regular text and
   additional data fields
5. **Given** multiple data fields are available, **When** the Analyst views the
   trigger menu, **Then** they see all available fields: Full Name, Date of
   Birth, Sort Code, and any other customer data fields

---

### User Story 2 - Protected Data Field Tags (Priority: P2)

Data fields appear as visual "pill" tags that behave as single, atomic objects
in the document. When an Analyst tries to edit a data field, they cannot
partially delete or modify it - the entire tag is selected and removed as one
unit. This prevents accidental corruption of the merge logic.

**Why this priority**: This prevents data integrity issues and typing errors. If
analysts could break the merge fields by deleting characters inside them, it
would defeat the purpose of the feature. This is the #1 way to ensure
professional standards are maintained.

**Independent Test**: Can be tested by inserting a data field into a document,
attempting to delete individual characters within the tag, and verifying the
entire tag is removed instead. Delivers protection against merge field
corruption.

**Acceptance Scenarios**:

1. **Given** a data field has been inserted into the document, **When** the
   Analyst views it, **Then** it appears as a visual "pill" or highlighted tag
   (e.g., `{{Full Name}}`)
2. **Given** a data field tag is in the document, **When** the Analyst clicks
   inside the tag to position the cursor, **Then** the entire tag is selected or
   highlighted as a single object
3. **Given** a data field tag is selected, **When** the Analyst presses delete
   or backspace, **Then** the entire tag is removed from the document
4. **Given** a data field tag is in the document, **When** the Analyst tries to
   type inside the tag, **Then** the tag is replaced or the system prevents
   partial editing
5. **Given** a data field tag exists in text, **When** the Analyst positions the
   cursor before or after the tag, **Then** they can type regular text without
   affecting the tag's integrity

---

### User Story 3 - Live Preview Validation (Priority: P3)

At the bottom of the screen, a "Final Review" area displays the document exactly
as it will appear when printed or sent to customers. Data field tags are
replaced with actual sample customer data (e.g., `{{Full Name}}` becomes "Mr.
Adrian Sterling"). The Analyst can review the document flow and formatting with
real data before finalizing.

**Why this priority**: This is a quality-of-life feature that helps analysts
catch formatting issues and verify the document reads naturally with real data.
It's valuable but not essential for the core functionality - analysts can still
create templates without it.

**Independent Test**: Can be tested by creating a document with data fields,
viewing the preview area, and verifying that tags are replaced with sample
customer data. Delivers confidence that the final output will look correct.

**Acceptance Scenarios**:

1. **Given** the Analyst has created a document with data fields, **When** they
   view the screen, **Then** a "Final Review" area is visible at the bottom
2. **Given** the document contains data field tags, **When** the preview area
   displays the document, **Then** all tags are replaced with sample customer
   data
3. **Given** the document contains `{{Full Name}}`, **When** the preview
   renders, **Then** it shows actual data like "Mr. Adrian Sterling"
4. **Given** the Analyst makes changes to the document, **When** they add or
   remove text or data fields, **Then** the preview updates to reflect the
   changes
5. **Given** the preview is displaying, **When** the Analyst reviews a sentence
   with merged data, **Then** they can verify the sentence flows correctly and
   reads naturally

---

### User Story 4 - Advanced Pill Interactions (Priority: P2-Enhanced)

Data field "pills" behave as solid, protected objects with advanced interaction
patterns that prevent accidental corruption and enable quick modifications. The
pills respond intelligently to keyboard navigation, clicks, and deletion
attempts, treating each variable as a discrete, replaceable component rather
than editable text.

**Why this priority**: These interaction patterns are critical for maintaining
document integrity and analyst productivity. They transform pills from simple
visual tags into intelligent UI components that guide users toward correct usage
and prevent common errors like partial deletion or accidental text insertion.
This directly supports the "professional standards" goal from the original
requirement.

**Independent Test**: Can be tested by creating a document with data fields,
then systematically testing deletion (backspace), navigation (arrow keys),
clicking, and visual appearance. Each behavior can be verified independently.
Delivers a polished, error-resistant editing experience.

**Acceptance Scenarios**:

1. **Atomic Deletion (The "Single-Block" Rule)**

   - **Given** a data field pill (e.g., `{{Account_Balance}}`) exists in the
     document
   - **When** the Analyst places their cursor immediately after the pill and
     presses Backspace
   - **Then** the entire variable is removed at once (not
     character-by-character)
   - **And** the system prevents partial deletion that would leave stray
     characters like `{{` or broken syntax
   - **User Value**: This ensures the template remains technically valid at all
     times by preventing corrupted merge fields

2. **Proactive Selection (Arrow Key Reveal)**

   - **Given** a data field pill exists in the document
   - **When** the Analyst moves their cursor using the Left or Right Arrow keys
     and crosses the boundary of the pill
   - **Then** the Variable Selector (searchable list of 1,000+ available fields)
     automatically fades in or highlights
   - **And** the current pill is selected/highlighted to indicate it's ready for
     replacement
   - **User Value**: This allows quick variable swapping (e.g., changing
     `{{Home_Phone}}` to `{{Mobile_Phone}}`) without deleting and re-typing

3. **Instant Modification (The "Click-to-Edit" Rule)**

   - **Given** a data field pill exists in the document
   - **When** the Analyst clicks directly on or inside the pill
   - **Then** instead of placing a text cursor inside the label, the editor
     triggers the Variable Search Menu (showing all 1,000+ available fields from
     the JSON data)
   - **And** the Analyst can immediately type to search and select a replacement
     variable
   - **User Value**: It treats the variable as a "button" or "field," enabling
     instant replacement from the full catalog of available keys

4. **Visual Distinction**
   - **Given** a data field pill exists in the document
   - **When** the Analyst views the editor
   - **Then** the pill is visually distinct from regular text with a subtle
     background color or border
   - **And** when a row is clicked in the AG-Grid below, the pills remain as
     labels in the editor
   - **And** the Live Preview pane shows the actual bank data substituted into
     those positions
   - **User Value**: Clear visual distinction helps analysts quickly identify
     which parts of the document are dynamic vs. static text

---

### User Story 5 - Text Alignment for Professional Layout (Priority: P2)

Analysts can apply text alignment (left, center, right, justify) to sections of
the document template using shortcode syntax, enabling professional formatting
for headers, signatures, footers, and structured content like addresses. The
alignment system uses a block-level shortcode format that wraps multiple
paragraphs or headings while preserving the underlying markdown structure.

**Why this priority**: Professional email templates often require centered
headers, right-aligned dates, justified body text, or centered signatures. This
feature enables analysts to create visually polished documents that meet
corporate branding standards without requiring HTML knowledge. It complements
the data field system by allowing formatted layout around merged customer data.

**Independent Test**: Can be tested by creating a document with various text
blocks, applying alignment shortcodes, and verifying that:

- The editor shows visual alignment styling (colored borders/badges)
- Preview/export maintains alignment via inline CSS styles
- Markdown source preserves shortcodes on save/reload
- Alignment works with nested content (headings, pills, lists)

**Acceptance Scenarios**:

1. **Shortcode Syntax for Alignment**

   - **Given** the Analyst is editing a document template
   - **When** they wrap content with alignment shortcodes: `[align:center]`,
     `[align:right]`, `[align:left]`, or `[align:justify]`
   - **Then** the wrapped content displays with the specified alignment in both
     editor and preview
   - **And** the shortcode syntax is preserved when saving and reloading the
     template
   - **User Value**: Provides a simple, text-based method to apply alignment
     without toolbar buttons or formatting menus

2. **Block-Level Content Support**

   - **Given** an alignment shortcode block exists in the document
   - **When** the Analyst types multiple paragraphs, headings, or inserts data
     field pills inside the alignment block
   - **Then** all nested content maintains the specified alignment
   - **And** markdown structure (headings, lists, pills) is preserved within the
     aligned block
   - **User Value**: Allows complex formatted sections (e.g., centered header
     with company logo pill + subtitle paragraph) without breaking document
     structure

3. **Visual Editor Feedback**

   - **Given** an alignment block exists in the document
   - **When** the Analyst views the editor
   - **Then** the alignment container displays a colored border (green=left,
     blue=center, orange=right, purple=justify)
   - **And** a small badge showing the alignment type appears on hover
   - **And** the editor cursor can freely move into and edit content within the
     alignment block
   - **User Value**: Clear visual distinction helps analysts understand document
     structure and identify aligned sections at a glance

4. **HTML Email Compatibility**

   - **Given** a document template with alignment shortcodes
   - **When** the template is merged with customer data and exported for email
   - **Then** alignment is rendered using inline CSS (`style="text-align: X;"`)
   - **And** the HTML output works correctly in email clients that strip
     external stylesheets
   - **User Value**: Ensures professional formatting survives the email
     rendering process across different email clients

---

### Edge Cases

- **No Customer Selected**: Analysts can create templates without having a
  customer selected. The data field menu always shows available fields
  regardless of customer selection, and the preview area uses sample data (e.g.,
  "Mr. Adrian Sterling") to demonstrate the merge functionality.
- **Missing Field Values**: When a customer record is missing a value for an
  inserted data field (e.g., Date of Birth is empty), the system displays a
  standard placeholder such as "(Not Available)" or leaves it as blank space in
  the merged document/preview. This maintains professional appearance while
  clearly indicating missing data.
- **Pasting Text with Trigger Characters**: When an Analyst pastes text from
  another application that contains the trigger character sequence `{{`, the
  characters are inserted as plain literal text without triggering pill creation
  menus. The analyst must manually convert text to pills if needed by deleting
  and re-inserting via the trigger menu. This prevents disruptive menu popups
  during paste operations.
- **Long Customer Data Values**: When customer data values are very long (e.g.,
  200+ character addresses), the system wraps text naturally to multiple lines
  like normal word processor text, maintaining all content without truncation.
  This ensures professional appearance in the final HTML output (with minimal
  styling) that will be sent via email.
- **Undo/Redo Operations**: The system supports full undo/redo functionality for
  all operations including typing text, inserting data field tags, and deleting
  content. When an analyst undoes the insertion of a data field tag, the tag is
  removed and the document returns to its previous state. Redo restores the tag.
- **Multiple Data Sources** (RESOLVED - OUT OF SCOPE): The system assumes a
  single customer data source for MVP. Multi-database support deferred to future
  iteration.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a clean, text-based editing interface for
  creating documents
- **FR-002**: System MUST support trigger character `{{` that opens a data field
  selection menu
- **FR-003**: System MUST display a menu of available data fields when trigger
  characters are typed
- **FR-004**: System MUST include at minimum these data fields: Full Name, Date
  of Birth, Sort Code
- **FR-005**: System MUST insert selected data fields into the document as
  visual tags at the cursor position
- **FR-006**: Data field tags MUST be visually distinct from regular text (e.g.,
  pill-shaped, highlighted, or with special formatting)
- **FR-007**: Data field tags MUST behave as atomic, non-editable objects that
  cannot be partially modified
- **FR-008**: System MUST remove the entire data field tag when the user
  attempts to delete it
- **FR-009**: System MUST allow users to type regular text before and after data
  field tags without affecting them
- **FR-010**: System MUST provide a preview area that displays the document with
  sample customer data merged in
- **FR-011**: Preview area MUST update when the document content changes
- **FR-012**: System MUST replace data field tags with actual customer data
  values in the preview
- **FR-013**: System MUST display a standard placeholder (e.g., "(Not
  Available)" or blank space) when a customer record is missing a value for a
  data field
- **FR-014**: System MUST save and persist created document templates in browser
  localStorage
- **FR-015**: System MUST provide functionality to download saved templates to
  the file system
- **FR-016**: System MUST provide functionality to upload templates from the
  file system into localStorage
- **FR-017**: System MUST allow analysts to access and select saved templates
  from localStorage for reuse with different customer data
- **FR-018**: System MUST support configurable display formats for data fields
  (e.g., date formats like "10 March 2026"), with sensible defaults provided for
  each field type
- **FR-019**: System MUST support full undo/redo functionality for all document
  editing operations including typing text, inserting data field tags, and
  deleting content
- **FR-020**: System MUST delete the entire data field pill as a single atomic
  unit when the user presses Backspace or Delete adjacent to the pill,
  preventing partial deletion that would leave stray syntax characters
- **FR-021**: System MUST visually highlight the data field pill when the user
  navigates across a pill boundary using arrow keys (cursor adjacent to pill).
  The Variable Selector menu appears only when the user clicks the highlighted
  pill or types the trigger character `{{`, allowing quick variable replacement
  without deletion
- **FR-022**: System MUST trigger the Variable Search Menu showing all 20-30
  available data field keys when the user clicks directly on a data field pill,
  treating the pill as a button/field rather than editable text
- **FR-023**: Data field pills MUST have visual distinction from regular text
  through styling (e.g., background color, border, or badge-like appearance) to
  clearly indicate they are dynamic placeholders
- **FR-024**: System MUST insert pasted text containing the trigger character
  sequence `{{` as literal text without automatically triggering the Variable
  Selector menu, preventing disruptive menu popups during paste operations
- **FR-025**: System MUST wrap long customer data values naturally within the
  document layout without breaking visual formatting, supporting the output
  format requirements for HTML email rendering
- **FR-026**: System MUST export merged documents as plain HTML with minimal
  styling suitable for email sending, preserving text formatting and data field
  substitutions without complex layout dependencies
- **FR-027**: System MUST provide a manual Save button that prompts the user to
  enter a template name before saving to localStorage, giving analysts explicit
  control over when templates are persisted
- **FR-028**: System MUST automatically save draft changes to localStorage
  (under a reserved "draft" key) every 30 seconds to prevent data loss, while
  keeping manual saves under user-specified names separate
- **FR-029**: System MUST support text alignment shortcodes using the syntax
  `[align:left]`, `[align:center]`, `[align:right]`, and `[align:justify]` with
  corresponding closing tags `[/align]` to wrap content blocks
- **FR-030**: Alignment shortcodes MUST support block-level content including
  multiple paragraphs, headings, lists, and data field pills within a single
  aligned block
- **FR-031**: System MUST preserve alignment shortcode syntax when saving
  templates to localStorage and when downloading templates to the file system,
  ensuring perfect round-trip fidelity
- **FR-032**: Editor MUST provide visual feedback for alignment blocks using
  colored borders (green for left, blue for center, orange for right, purple for
  justify) and hover badges showing the alignment type
- **FR-033**: System MUST convert alignment shortcodes to inline CSS
  (`style="text-align: X;"`) when exporting merged documents as HTML for email,
  ensuring email client compatibility without external stylesheets
- **FR-034**: Users MUST be able to edit content freely within alignment blocks,
  with the cursor moving naturally into and out of aligned sections without
  requiring special navigation commands
- **FR-035**: System MUST render alignment correctly in the live preview pane,
  showing the same text alignment that will appear in the final HTML email
  output

### Key Entities _(include if feature involves data)_

- **Document Template**: A reusable document structure containing static text
  and data field placeholders. Attributes include template name, creation date,
  last modified date, and content (mix of text and data field references).
- **Data Field**: A named reference to a specific piece of customer information.
  Attributes include field name (e.g., "Full Name"), field type (e.g., text,
  date, number), and display format (configurable with sensible defaults - e.g.,
  dates default to "10 March 2026" format). Fields are inserted into templates
  and rendered as visual tags.
- **Customer Data**: The actual information about a customer that populates the
  data fields. Attributes include all available customer properties (Full Name,
  Date of Birth, Sort Code, etc.). One customer record provides values for all
  fields in a template.
- **Merged Document**: The final output created by combining a Document Template
  with Customer Data. All data field placeholders are replaced with actual
  values from the customer record. This is what the preview shows and what gets
  saved/printed/sent.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Analysts can create a complete document template with at least 3
  data fields in under 5 minutes
- **SC-002**: Manual typing errors in customer reports are reduced by at least
  80% compared to manually typing customer data
- **SC-003**: 95% of analysts successfully insert a data field on their first
  attempt without training
- **SC-004**: Time to create a customer-specific report is reduced by at least
  60% when using templates versus manual creation
- **SC-005**: Zero instances of broken or corrupted data field tags in
  production documents (protected tag feature prevents this)
- **SC-006**: 90% of analysts report high confidence in document accuracy when
  using the preview feature
- **SC-007**: Template reuse rate reaches at least 70% - meaning most reports
  are created from existing templates rather than from scratch
- **SC-008**: Zero instances of corrupted pill syntax (partial deletions, stray
  characters) in analyst-created templates due to atomic deletion and
  click-to-edit behaviors
- **SC-009**: Analysts can swap one data field for another in under 3 seconds
  using arrow key navigation or click-to-edit, without needing to delete and
  re-insert
- **SC-010**: 100% of alignment shortcodes are preserved with perfect fidelity
  when templates are saved to localStorage and reloaded, ensuring no data loss
  or corruption of formatting markup
- **SC-011**: Alignment formatting renders correctly in the HTML preview and
  exported email output 100% of the time, matching the visual alignment shown in
  the editor with colored borders and badges

## Assumptions & Dependencies _(optional)_

### Assumptions

- **Data Catalog Structure**: The customer data catalog contains approximately
  20-30 distinct field keys (columns such as Full Name, Date of Birth, Sort
  Code, Account Number, etc.) with the AG-Grid displaying 1,000+ customer
  records (rows). This structure informs the Variable Selector design and
  performance requirements for handling large datasets.
- **Output Format**: Merged document output is primarily intended for HTML email
  sending, requiring plain HTML with minimal styling and natural text wrapping
  for long customer data values. This design constraint guides the document
  rendering and export functionality.
- **Save Workflow Pattern**: Analysts expect manual control over template saving
  via a Save button with name prompt, while the system provides auto-save draft
  functionality as a data loss prevention safety net. This dual-save pattern
  balances user control with data protection.
- **Customer Data Availability**: Customer selection is NOT required for
  template creation. Analysts can create and edit templates without selecting a
  customer. When a customer is selected, the preview can optionally display real
  customer data; otherwise, it uses sample data (e.g., "Mr. Adrian Sterling").
- **Initial Data Fields**: The initial set of data fields (Full Name, Date of
  Birth, Sort Code) covers the most common use cases for bank reports.
  Additional fields can be added in future iterations based on analyst feedback.
- **Trigger Character Usability**: The trigger character `{{` is intuitive for
  analysts and does not commonly appear in standard banking document text. If
  conflicts arise, the trigger character can be configured.
- **Preview Sample Data**: When no specific customer is selected, the preview
  displays sample/mock data (e.g., "Mr. Adrian Sterling") to demonstrate the
  merge functionality. Analysts understand this is placeholder data.
- **Template Storage**: Document templates are stored in browser localStorage
  for persistence across sessions. Analysts can download templates to the file
  system for backup/sharing and upload them back into localStorage when needed.
  Export to final document formats (e.g., Word, PDF) is out of scope for the
  initial release.
- **Single Customer Context**: Each document is associated with a single
  customer record. Multi-customer reports are out of scope for this feature.
- **Single Data Source**: The system assumes a single customer data source for
  the initial release. Multi-database support is out of scope for MVP.
- **Trigger Character**: Only `{{` is used as the trigger character for opening
  the data field selection menu. The `[` character is treated as literal text.
- **No Field Format UI**: Field display formats use hardcoded sensible defaults
  (dates: "10 March 2026", currency: "$1,234.56"). Configuration UI is out of
  scope for MVP.

### Dependencies

- **Customer Data Source**: The feature depends on access to a customer data
  source (database, API, or service) that provides the fields listed in FR-004.
- **User Authentication**: Analysts must be authenticated and authorized to
  access customer data before using this feature (existing authentication system
  assumed).
- **Browser Compatibility**: The feature assumes a modern web browser with
  support for rich text editing capabilities (standard for current banking
  applications).
