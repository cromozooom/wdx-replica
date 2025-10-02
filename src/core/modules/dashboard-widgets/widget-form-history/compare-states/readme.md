# task description

I need to be able to compare 2 history states In order to do so, I need to
generate a compare json

this json should make the next thing:

1. for every 2 items to compare it should take the form schema and add uniques
   fields in both

example

previous

- name (value Null)
- age (value 3)

current

- full Name ( Razvan Nicu)
- age (value 3)
- gender (male)

the json should be

form

- Form Authors (prevValue UserX and currentVal UserY)
- name ( prevValue Null and currentVal removedField)
- full Name (prevVal removedField and currentVal 'Razvan Nicu')
- age ( prevVal 3 and currentVal 3)
- gender (prevVal newField and currentVal 'male')

So I can iterate on each row and show what is changed What would be tha plan to
do something like that, please start by creating a new component "compare-grid"
and give a list of task so I can check the compilation after every step

## PLan

1. Scaffold the Component

- Create a new standalone Angular component named compare-grid in the
  appropriate folder.
- Expose two @Input() properties: prev and current (objects to compare).
- Expose an optional @Input() for the schema if needed.

Checkpoint: Ensure the project compiles and the new component renders a
placeholder.

2. Implement the Comparison Logic

- Write a function to:
  - Collect all unique field names from both prev and current.
  - For each field, determine:
    - prevValue (from prev or special marker if missing)
    - currentValue (from current or special marker if missing)
    - status: "both", "onlyPrev", "onlyCurrent"
- Output an array of comparison rows.

Checkpoint: Add a debug output (e.g., <pre>{{ compareRows | json }}</pre>) and
check compilation.

3. Render the Comparison Table

- Use an HTML table or flex layout.
- For each row, display:
  - Field name
  - Previous value
  - Current value
  - Status (for debugging/visual cues)

Checkpoint: Table renders with correct data for various test cases.

4. Add Visual Cues

- Use ngClass or inline styles to:
  - Add a dotted border for missing fields.
  - Highlight changed values (green/red).
  - Show no highlight for unchanged values.

Checkpoint: Visual cues appear as expected.

5. Polish and Document

- Add a README or inline comments explaining usage.
- Ensure the component is reusable and inputs are well-typed.

Checkpoint: Final compilation and visual check.
