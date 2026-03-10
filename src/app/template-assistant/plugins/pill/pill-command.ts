/**
 * Commands for pill node manipulation.
 * Provides insert and delete operations for pills.
 */

import { $command } from "@milkdown/utils";
import { Selection } from "@milkdown/prose/state";

/**
 * Insert pill command.
 * Inserts a pill node at the current cursor position.
 */
export const insertPillCommand = $command(
  "insertPill",
  (ctx) => (fieldId?: string) => (state: any, dispatch: any) => {
    const { schema, tr } = state;
    const pillType = schema.nodes["pill"];

    if (!pillType || !fieldId) {
      return false;
    }

    const pill = pillType.create({ fieldId });
    const transaction = tr.replaceSelectionWith(pill);

    if (dispatch) {
      dispatch(transaction);
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
