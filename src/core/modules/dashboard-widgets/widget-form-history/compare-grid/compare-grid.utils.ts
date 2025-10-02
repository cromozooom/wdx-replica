/**
 * Represents a row in the compare grid, showing a field and its values in previous and current objects.
 *
 * - status 'both': field exists in both prev and current
 * - status 'onlyPrev': field exists only in prev
 * - status 'onlyCurrent': field exists only in current
 */
export interface CompareGridRow {
  field: string;
  prevValue: any;
  currentValue: any;
  status: "both" | "onlyPrev" | "onlyCurrent";
}

/**
 * Compares two flat objects and returns an array of CompareGridRow for all unique fields.
 *
 * @param prev The previous object (can be null/undefined)
 * @param current The current object (can be null/undefined)
 * @returns Array of CompareGridRow with field, prevValue, currentValue, and status
 *
 * Example:
 *   prev = { name: null, age: 3 }
 *   current = { 'full Name': 'Razvan Nicu', age: 3, gender: 'male' }
 *   buildCompareRows(prev, current) will return:
 *   [
 *     { field: 'name', prevValue: null, currentValue: undefined, status: 'onlyPrev' },
 *     { field: 'age', prevValue: 3, currentValue: 3, status: 'both' },
 *     { field: 'full Name', prevValue: undefined, currentValue: 'Razvan Nicu', status: 'onlyCurrent' },
 *     { field: 'gender', prevValue: undefined, currentValue: 'male', status: 'onlyCurrent' },
 *   ]
 */
export function buildCompareRows(prev: any, current: any): CompareGridRow[] {
  const prevFields = prev ? Object.keys(prev) : [];
  const currentFields = current ? Object.keys(current) : [];
  const allFields = Array.from(new Set([...prevFields, ...currentFields]));

  return allFields.map((field) => {
    const prevValue = prev ? prev[field] : undefined;
    const currentValue = current ? current[field] : undefined;
    let status: CompareGridRow["status"] = "both";
    if (prevValue === undefined) status = "onlyCurrent";
    else if (currentValue === undefined) status = "onlyPrev";
    return { field, prevValue, currentValue, status };
  });
}
