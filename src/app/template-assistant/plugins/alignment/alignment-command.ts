/**
 * Commands for inserting and managing alignment containers.
 *
 * Note: These commands are placeholder exports for the plugin system.
 * The actual alignment logic is implemented directly in the component
 * by wrapping selected text with [align:X]...[/align] shortcode syntax.
 */

import { $command } from "@milkdown/utils";

/**
 * Command placeholder for setting alignment.
 * The actual implementation is in the component's applyAlignment() method.
 */
export const setAlignmentCommand = $command("SetAlignment", () => () => () => {
  // This is a placeholder - actual logic is in the component
  return true;
});

/**
 * Command placeholder for removing alignment.
 * The actual implementation is in the component's removeAlignment() method.
 */
export const removeAlignmentCommand = $command(
  "RemoveAlignment",
  () => () => () => {
    // This is a placeholder - actual logic is in the component
    return true;
  },
);
