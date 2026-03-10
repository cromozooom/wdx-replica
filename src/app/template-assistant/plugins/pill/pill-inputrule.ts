/**
 * Input rule for pill insertion.
 * Triggers pill menu when user types {{ characters.
 */

import { $inputRule } from "@milkdown/utils";

/**
 * Input rule that matches {{ trigger pattern.
 * When detected, shows field selector menu for pill insertion.
 */
export const pillInputRule = $inputRule((ctx) => ({
  match: /\{\{$/,
  handler: (state, match, start, end) => {
    // Remove the trigger characters
    const tr = state.tr.delete(start, end);

    // Dispatch custom event for pill menu to open
    const event = new CustomEvent("pill-trigger", {
      detail: { position: start },
    });
    document.dispatchEvent(event);

    return tr;
  },
}));
