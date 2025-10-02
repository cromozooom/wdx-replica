/**
 * Represents a row in the compare grid, showing a field and its values in previous and current objects.
 *
 * - status 'both': field exists in both prev and current
 * - status 'onlyPrev': field exists only in prev
 * - status 'onlyCurrent': field exists only in current
 */
import { CompareStatus } from "./compare-status.enum";

export interface CompareGridRow {
  field: string;
  label: string;
  prevValue: any;
  currentValue: any;
  status: CompareStatus;
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
    if (key === "formAuthors") continue; // skip formAuthors as a row
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
        status: CompareStatus.Group,
        children,
      });
    } else {
      const prevValue = prev && key in prev ? prev[key] : undefined;
      const currentValue = current && key in current ? current[key] : undefined;
      let status: CompareGridRow["status"];
      if (prevValue === undefined && currentValue === undefined) {
        status = CompareStatus.Untouched;
      } else if (prevValue === undefined) {
        status = CompareStatus.New;
      } else if (currentValue === undefined) {
        status = CompareStatus.Removed;
      } else if (prevValue !== currentValue) {
        status = CompareStatus.Changed;
      } else {
        status = CompareStatus.Untouched;
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
