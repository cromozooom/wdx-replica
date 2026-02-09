# Feature Specification: Garden Room Structural Logic

**Feature Branch**: `001-garden-room-structural-logic`  
**Created**: 2026-02-08  
**Status**: Draft  
**Input**: User description: "Project Specification: Garden Room Structural
Logic. 1. The \"Base-Up\" Height Constraint. The app must prioritize the Global
Height Limit (e.g., 250cm). Every wall height is a calculated result, not a
fixed input. Calculation Flow: [Max Allowed] minus [Concrete offset] minus [Roof
System thickness] minus [Floor System thickness] = Maximum Permissible Wall
Frame Height. The Fall Logic: The app must automatically calculate a 1:40 slope.
If the Front Wall is the Master Height, the Back Wall height is automatically
derived by subtracting the slope over the span. 2. Wall Anatomy & Component
Logic. Each wall is treated as a collection of vertical and horizontal Members.
A. The Vertical Members (Studs). Standard Studs: Positioned at a fixed
Inter-stud Gap (e.g., 40cm or 60cm). This gap is dictated by the width of the
insulation material to ensure a friction fit with no cutting. Decorative/Corner
Studs: The app must allow for End Zone offsets. If a user defines a 10cm
decoration gap, the app inserts an additional stud 10cm from the corner. The
Clash Rule: If a standard stud placement falls within 5cm of a decorative stud,
the app should merge them or prioritize the decorative stud to prevent
impossible gaps. B. The Horizontal Members (Plates & Noggins). Top & Bottom
Plates: These run the full length of the wall. The vertical stud heights must be
automatically reduced by the combined thickness of these two plates. Noggins
(Bracing): Horizontal spacers between studs. Logic: Noggins must be calculated
as Inter-stud width. Placement: They should be staggered (offset height) in the
calculation to allow for straight-line screwing through the studs. 3. Side Wall
(Trapezoid) Logic. Side walls connect the Front (High) and Back (Low) walls. The
Sloped Top Plate: The top plate of a side wall is longer than the floor plate
(Hypotenuse). Variable Stud Heights: Each stud in a side wall has a unique
height. The app must calculate these heights individually using the slope angle
so the roof sits perfectly flat across all four walls. 4. Material Bin-Packing &
Extraction. Market-Ready Dimensions: The app must compare the Cut List against
Stock Lengths (e.g., 2.4m, 3.6m, 4.8m). Optimization: It should calculate how to
cut multiple studs from one stock length to minimize waste. Sheet Nesting: For
Plywood and Insulation, the app calculates the total area but accounts for the
Grid (e.g., 2.4m x 1.2m sheets) to ensure the user doesn't just buy the m^2
area, but the actual number of physical sheets required. 5. Product Extraction
Rules. The final output must be divided into: The Buy List: Total number of
full-length boards and sheets to order from the merchant. The Cut List: A
step-by-step guide for the builder (e.g., From a 4.8m board, cut one 217cm stud
and one 209cm stud). The Hardware List: Screws, foil tape, and membranes based
on the total linear meters of timber and surface area of the sheets."

## Clarifications

### Session 2026-02-08

- Q: When a standard stud placement falls within 5 cm of a decorative stud,
  which stud should be retained? → A: Keep the decorative stud, drop the
  standard stud
- Q: What should happen when the calculated wall frame height is zero or
  negative after subtracting offsets? → A: Show validation error and prevent
  calculation

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Calculate compliant wall heights (Priority: P1)

As a designer, I want all wall heights to be derived from the global height
limit and roof fall so that the structure is compliant and the roof sits
correctly.

**Why this priority**: Without correct wall heights and slope, the structure is
invalid and all downstream calculations are wrong.

**Independent Test**: Can be fully tested by entering height limit, offsets,
floor/roof thickness, and span, then verifying the calculated front/back and
side wall stud heights.

**Acceptance Scenarios**:

1. **Given** a global height limit, concrete offset, roof thickness, and floor
   thickness, **When** the wall heights are calculated, **Then** the maximum
   permissible wall frame height equals limit minus the three offsets.
2. **Given** a front wall master height and a span, **When** a 1:40 fall is
   applied, **Then** the back wall height equals the front height minus the fall
   over the span.
3. **Given** front and back wall heights, **When** side walls are calculated,
   **Then** each side wall stud height is individually derived so the roof plane
   is level across all walls.

---

### User Story 2 - Generate wall member layouts (Priority: P2)

As a builder, I want a precise layout of studs, plates, and noggins so that I
can build the frame without guesswork or conflicts.

**Why this priority**: Accurate member layout ensures structural integrity and
avoids rework caused by spacing conflicts.

**Independent Test**: Can be tested by providing wall length, stud gap, and end
zone offsets, then verifying stud positions, plate deductions, and noggin
sizing/staggering.

**Acceptance Scenarios**:

1. **Given** an inter-stud gap and wall length, **When** standard studs are
   placed, **Then** studs are positioned at the fixed gap along the wall length.
2. **Given** an end zone offset, **When** decorative studs are inserted,
   **Then** each decorative stud is placed at the specified distance from the
   corner.
3. **Given** a standard stud placement within 5 cm of a decorative stud,
   **When** the clash rule applies, **Then** only one stud position is retained.
4. **Given** top and bottom plate thicknesses, **When** stud heights are
   calculated, **Then** each stud height is reduced by the combined plate
   thickness.
5. **Given** an inter-stud gap, **When** noggins are calculated, **Then** each
   noggin length equals the inter-stud width and is staggered between rows.

---

### User Story 3 - Produce ordering and cut guidance (Priority: P3)

As a buyer, I want optimized buy, cut, and hardware lists so that I can order
the right materials and cut them efficiently.

**Why this priority**: Ordering accuracy and cut efficiency directly reduce cost
and waste.

**Independent Test**: Can be tested by supplying a cut list and stock lengths,
then verifying the buy list, optimized cutting plan, sheet counts, and hardware
totals.

**Acceptance Scenarios**:

1. **Given** a cut list and stock lengths, **When** optimization is performed,
   **Then** the plan groups cuts per stock length to minimize waste.
2. **Given** total sheet area and sheet grid sizes, **When** sheet counts are
   calculated, **Then** the result is an integer number of full sheets required.
3. **Given** total timber length and sheet surface area, **When** hardware is
   calculated, **Then** the hardware list scales with those totals.

---

### Edge Cases

- When the calculated wall frame height is zero or negative after subtracting
  offsets, the system displays a validation error and prevents calculation.
- How does the system handle a span of zero or extremely short spans where the
  1:40 fall is less than measurement precision?
- What happens when end zone offsets leave less than one standard stud gap for
  interior studs?
- How does the system handle stock lengths shorter than the longest required
  cut?
- What happens when sheet sizes do not evenly divide the required area?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST calculate maximum permissible wall frame height as
  global height limit minus concrete offset minus roof system thickness minus
  floor system thickness.
- **FR-001a**: System MUST validate that the calculated wall frame height is
  positive and display an error if the height is zero or negative, preventing
  further calculation.
- **FR-002**: System MUST calculate back wall height by applying a 1:40 fall
  from the front wall over the specified span.
- **FR-003**: System MUST calculate each side wall stud height individually so
  the roof plane is continuous from front to back.
- **FR-004**: System MUST place standard studs at a fixed inter-stud gap along
  the wall length.
- **FR-005**: System MUST support end zone offsets that insert decorative studs
  at specified distances from wall corners.
- **FR-006**: System MUST resolve stud clashes by prioritizing the decorative
  stud and removing the standard stud when a standard stud is within 5 cm of a
  decorative stud.
- **FR-007**: System MUST reduce stud heights by the combined thickness of top
  and bottom plates.
- **FR-008**: System MUST set each noggin length to the inter-stud width and
  stagger noggin positions between rows.
- **FR-009**: System MUST calculate the side wall top plate length as the
  hypotenuse connecting front and back wall heights across the span.
- **FR-010**: System MUST compare required cuts against available stock lengths
  and produce an optimized cutting plan that minimizes waste.
- **FR-011**: System MUST calculate sheet quantities as whole-sheet counts based
  on required area and sheet grid dimensions.
- **FR-012**: System MUST output separate Buy List, Cut List, and Hardware List
  for the project.
- **FR-013**: System MUST scale the Hardware List based on total linear meters
  of timber and total sheet surface area.

### Key Entities _(include if feature involves data)_

- **Project**: A garden room design with input dimensions, material selections,
  and derived outputs.
- **Wall**: A boundary element (front, back, left, right) with height profile,
  span, and member layout.
- **Member**: A structural element (stud, plate, noggin) with position, length,
  and role.
- **Cut Requirement**: A required piece length and quantity derived from
  members.
- **Stock Length**: A purchasable board length used for optimization.
- **Sheet Requirement**: A required surface area and grid size used to determine
  sheet counts.
- **Output List**: A collection of items for Buy, Cut, or Hardware outputs.

### Assumptions

- All dimensions are provided in consistent metric units (cm or m) and are
  converted consistently during calculation.
- The front wall is the default master height unless the user explicitly selects
  another wall.
- A 1:40 fall is the default slope ratio unless the user provides a different
  value.
- Insulation width defines the inter-stud gap and is provided by the user.
- Stock lengths and sheet grid sizes are provided by the user or a configurable
  catalog.

### Scope Boundaries

**In Scope**:

- Structural calculations for wall heights, slopes, and member sizing for a
  four-wall garden room frame.
- Generation of Buy List, Cut List, and Hardware List based on calculated
  members and materials.

**Out of Scope**:

- Structural engineering certification or code compliance validation beyond the
  specified rules.
- Cost estimation, vendor pricing, or procurement workflows.
- Construction sequencing or on-site installation instructions beyond cut
  guidance.

### Acceptance Coverage

- **FR-001 to FR-003** are validated by User Story 1 acceptance scenarios.
- **FR-004 to FR-009** are validated by User Story 2 acceptance scenarios.
- **FR-010 to FR-013** are validated by User Story 3 acceptance scenarios.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of calculated wall heights match the specified formula and
  slope within the chosen unit precision.
- **SC-002**: Users can generate complete Buy List, Cut List, and Hardware List
  for a standard four-wall design in under 2 minutes.
- **SC-003**: At least 95% of test designs produce no unresolved stud clashes.
- **SC-004**: For a defined set of test designs, the optimized cut plan reduces
  waste compared to a naive single-piece-per-stock approach in at least 90% of
  cases.
