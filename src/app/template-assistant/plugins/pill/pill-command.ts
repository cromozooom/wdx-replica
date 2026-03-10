/**
 * Commands for pill node manipulation.
 * Provides insert and delete operations for pills.
 */

import { $command } from "@milkdown/utils";
import { Selection } from "@milkdown/prose/state";

/**
 * Insert pill command.
 * Inserts a pill node at the specified position or current cursor position.
 */
export const insertPillCommand = $command(
  "insertPill",
  (ctx) =>
    (params?: { fieldId?: string; position?: number | null } | string) =>
    (state: any, dispatch: any) => {
      const { schema, tr } = state;
      const pillType = schema.nodes["pill"];

      // Handle both old string format and new object format for backward compatibility
      let fieldId: string | undefined;
      let position: number | null | undefined;

      if (typeof params === "string") {
        fieldId = params;
        position = null;
      } else if (params && typeof params === "object") {
        fieldId = params.fieldId;
        position = params.position;
      }

      if (!pillType || !fieldId) {
        console.error("insertPillCommand: Missing pillType or fieldId", {
          pillType,
          fieldId,
        });
        return false;
      }

      console.log(
        "insertPillCommand: Creating pill with fieldId:",
        fieldId,
        "at position:",
        position,
      );

      const pill = pillType.create({ fieldId });

      let transaction;
      if (position !== null && position !== undefined) {
        // Insert at specific position
        console.log(
          "insertPillCommand: Inserting at specific position:",
          position,
        );
        transaction = tr.insert(position, pill);
      } else {
        // Replace current selection
        console.log("insertPillCommand: Replacing selection");
        transaction = tr.replaceSelectionWith(pill);
      }

      if (dispatch) {
        dispatch(transaction);
        console.log("insertPillCommand: Transaction dispatched successfully");
      }

      return true;
    },
);

/**
 * Delete pill command.
 * Deletes the entire pill node as an atomic unit.
 */
export const deletePillCommand = $command(
  "deletePill",
  (ctx) => () => (state: any, dispatch: any) => {
    const { tr, selection } = state;
    const { $from } = selection;

    // Find pill node at cursor position
    const pillNode = $from.parent.childAfter($from.parentOffset).node;

    if (pillNode && pillNode.type.name === "pill") {
      const start = $from.pos;
      const end = start + pillNode.nodeSize;
      const transaction = tr.delete(start, end);

      if (dispatch) {
        dispatch(transaction);
      }

      return true;
    }

    return false;
  },
);
