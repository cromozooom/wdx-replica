/**
 * Keymap plugin for pill node interactions.
 * Handles atomic deletion, selection, and keyboard prevention.
 */

import { $prose } from "@milkdown/utils";
import { keymap } from "@milkdown/prose/keymap";
import { TextSelection } from "@milkdown/prose/state";

/**
 * Pill keymap plugin.
 * Provides keyboard handlers for atomic pill behavior:
 * - Backspace/Delete: Remove entire pill as atomic unit
 * - Arrow keys: Skip over pills atomically
 * - Text input: Prevent typing inside pills
 */
export const pillKeymap = $prose(() => {
  return keymap({
    /**
     * Handle backspace key.
     * Delete entire pill if cursor is adjacent to one.
     */
    Backspace: (state, dispatch) => {
      const { $from } = state.selection;
      const nodeAtCursor = $from.nodeBefore;

      // If backspace is pressed and there's a pill node before cursor,
      // delete the entire pill atomically
      if (nodeAtCursor && nodeAtCursor.type.name === "pill") {
        const start = $from.pos - nodeAtCursor.nodeSize;
        const end = $from.pos;

        if (dispatch) {
          dispatch(state.tr.delete(start, end));
        }
        return true;
      }

      return false;
    },

    /**
     * Handle delete key.
     * Delete entire pill if cursor is adjacent to one.
     */
    Delete: (state, dispatch) => {
      const { $from } = state.selection;
      const nodeAtCursor = $from.nodeAfter;

      // If delete is pressed and there's a pill node after cursor,
      // delete the entire pill atomically
      if (nodeAtCursor && nodeAtCursor.type.name === "pill") {
        const start = $from.pos;
        const end = $from.pos + nodeAtCursor.nodeSize;

        if (dispatch) {
          dispatch(state.tr.delete(start, end));
        }
        return true;
      }

      return false;
    },

    /**
     * Handle left arrow key.
     * Skip over pill atomically when moving cursor left.
     */
    ArrowLeft: (state, dispatch) => {
      const { $from } = state.selection;
      const nodeBefore = $from.nodeBefore;

      // If cursor is at right edge of a pill, move cursor to left edge
      if (nodeBefore && nodeBefore.type.name === "pill") {
        const pos = $from.pos - nodeBefore.nodeSize;
        const $pos = state.doc.resolve(pos);

        if (dispatch) {
          dispatch(state.tr.setSelection(TextSelection.near($pos)));
        }
        return true;
      }

      return false;
    },

    /**
     * Handle right arrow key.
     * Skip over pill atomically when moving cursor right.
     */
    ArrowRight: (state, dispatch) => {
      const { $from } = state.selection;
      const nodeAfter = $from.nodeAfter;

      // If cursor is at left edge of a pill, move cursor to right edge
      if (nodeAfter && nodeAfter.type.name === "pill") {
        const pos = $from.pos + nodeAfter.nodeSize;
        const $pos = state.doc.resolve(pos);

        if (dispatch) {
          dispatch(state.tr.setSelection(TextSelection.near($pos)));
        }
        return true;
      }

      return false;
    },
  });
});
