/**
 * Represents a row in the compare grid, showing a field and its values in previous and current objects.
 *
 * - status 'both': field exists in both prev and current
 * - status 'onlyPrev': field exists only in prev
 * - status 'onlyCurrent': field exists only in current
 */
export interface CompareGridRow {
  field: string;
  label: string;
  prevValue: any;
  currentValue: any;
  status: "untouched" | "removedField" | "newField" | "changed" | "group";
  children?: CompareGridRow[];
}

/**
 * Recursively compares two objects using a JSON schema and returns an array of CompareGridRow for all fields/groups in the schema.
 *
 * @param prev The previous object (can be null/undefined)
 * @param current The current object (can be null/undefined)
 * @param schema The JSON schema describing the form structure
 * @returns Array of CompareGridRow with field, label, prevValue, currentValue, status, and children for groups
 */
export function buildCompareRows(
  prev: any,
  current: any,
  schema: any
): CompareGridRow[] {
  if (!schema || !schema.properties) return [];
  const rows: CompareGridRow[] = [];
  for (const key of Object.keys(schema.properties)) {
    const prop = schema.properties[key];
    const label = prop.title || key;
    if (prop.type === "object" && prop.properties) {
      // Group row
      const children = buildCompareRows(
        prev ? prev[key] : undefined,
        current ? current[key] : undefined,
        prop
      );
      rows.push({
        field: key,
        label,
        prevValue: undefined,
        currentValue: undefined,
        status: "group",
        children,
      });
    } else {
      const prevValue = prev ? prev[key] : undefined;
      const currentValue = current ? current[key] : undefined;
      let status: CompareGridRow["status"];
      if (prevValue === undefined && currentValue === undefined) {
        status = "untouched";
      } else if (prevValue === undefined) {
        status = "newField";
      } else if (currentValue === undefined) {
        status = "removedField";
      } else if (prevValue !== currentValue) {
        status = "changed";
      } else {
        status = "untouched";
      }
      rows.push({
        field: key,
        label,
        prevValue,
        currentValue,
        status,
      });
    }
  }
  return rows;
}
