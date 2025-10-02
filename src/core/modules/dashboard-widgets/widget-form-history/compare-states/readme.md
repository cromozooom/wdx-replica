1. Build a Unified Schema

   - Collect all unique field names from both form versions (current and
     previous/next).

2. Prepare Data for Display

   - For each field in the unified schema:
     - Get the value from each version (current and previous/next).
     - If a field is missing, treat its value as null.

3. Render Parallel Field Comparison

   - Display a two-column layout:
     - Left: Current version values.
     - Right: Previous/next version values.
   - Each row represents a field, with the field name and both values side by
     side.

4. Visual Cues
   - If a field is missing in one version, show a dotted border for that cell.
   - If values differ, highlight the cells (green/red for updated/removed).
   - If values are the same, no highlight.
5. Implementation Steps

   - Write a function to merge field names from both objects.
   - Map over the unified field list to build a display array.
   - Use an HTML table or flex layout to render:

     - Field name | Current value | Previous/Next value

   - Use ngClass or inline styles for dotted borders and highlights.
