I would like to simulate an experience in my angular app, for that I need a

# sample data

# an advanced selector:

is a selector field that will request for example a form, but in order to
understand what I'm doing I need to have few elements:

1. the selector as ng-select with name of the forms

2. a container which it will take data from DB and it will display below the
   selector:

example: this form "Appointment" (name of the form) has "Contact" (name of the
entity) and you choose "All Contacts" (name of the query)

3. a button which it will open a full screen modal with buttons for "save" and
   "cancel" an ag-grid with all the forms name in a columns with associated
   entities and each entity it will have a list of queries, so I will have to
   repeat the row for each query on another one and the option to select one
   single row from all which it will fill the ng-select when press on "save".

In this modal If I click on the query I should be able to see on the side the
details of the query and it will display the result in the container below, so I
can understand what I'm doing and what I'm selecting

In order to prove this concept I also need sample data for other type of
selection, example documents instead of forms and their associated entities and
queries.

1. The Core Interaction: "SPX Magic Selector"

The entry point is a streamlined ng-select component. While it functions as a
standard searchable dropdown for quick access to "Forms" or "Documents," its
primary power lies in the Advanced Lookup Trigger—an icon or button that
launches the Discovery Modal for complex decision-making.The Contextual Preview
ContainerDirectly beneath the selector sits a dynamic "Metadata Breadcrumb" or
info-card.

As soon as a selection is made, this container fetches and displays the
underlying data lineage:

1. Entity Mapping: (e.g., This form belongs to the "Contact" entity)

- Active Query: (e.g., Currently filtering by "All Active Contacts")
- Live Count: A small badge showing how many records currently satisfy that
  query.

2. The Discovery Modal: "The Deep Dive"When the user needs more than just a
   name, they open the Full-Screen Discovery Environment. This is designed to
   eliminate guesswork. The Master Grid (Ag-Grid) The left side of the modal
   features an Ag-Grid instance. To handle the one-to-many relationship (one
   form having multiple queries), the grid uses a flattened row strategy.If
   "Appointment Form" has three queries, it appears as three distinct rows,
   ensuring every possible data view is selectable with a single click.

Selection Logic: A radio-button style selection that ensures only one specific
Form-Entity-Query combination is carried back to the main app.The Live Inspector
(Side Panel)Clicking a row doesn't just select it; it "inspects" it. A side
panel slides out (or updates) to show:Query Parameters: A human-readable
breakdown of the filters being applied.Data Preview: A mini-result set showing
the first 5 records this query would return. This ensures the user says, "Yes,
these are the records I was expecting to see."3. Sample Data ArchitectureTo
prove the concept across different business domains, the system will toggle
between two primary schemas:Domain A: CRM & Scheduling (Forms)Form
NameAssociated EntityQuery NameDescriptionAppointmentContactAll ContactsReturns
every person in the DB.AppointmentContactRecent LeadsOnly contacts created in
the last 30 days.Follow-upTaskOverdue TasksShows high-priority items past their
due date.Domain B: Document Management (Files)Document TypeAssociated
EntityQuery NameDescriptionService AgreementLegal ContractPending
SignatureDocuments sent but not yet executed.Service AgreementLegal
ContractExpiredHistorically signed contracts that are no longer
valid.InvoiceBilling RecordHigh Value (>10k)Filters for financial records
exceeding a specific threshold.4. User Workflow SummarySelect: User interacts
with the ng-select.Verify: The container below confirms the Entity and Query
being used.Explore: If unsure, the user opens the Discovery Modal.Validate: They
browse the Ag-Grid, click a "Query," see the real-time data preview in the
inspector, and hit Save.Sync: The modal closes, and the main selector and
preview container are automatically updated with the specific selection.Would
you like me to generate the TypeScript interfaces and the JSON structure for
this sample data so you can plug it directly into your services?
