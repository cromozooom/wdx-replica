/**
 * Barrel export for alignment plugin.
 * Provides shortcode syntax [align:X]...[/align] for text alignment.
 */

export { alignmentParser } from "./alignment-parser";
export { alignmentContainerNode } from "./alignment-node";
export { setAlignmentCommand, removeAlignmentCommand } from "./alignment-command";

/**
 * Complete alignment plugin for Milkdown.
 * Usage: editor.use(alignmentPlugin)
 */
import { alignmentParser } from "./alignment-parser";
import { alignmentContainerNode } from "./alignment-node";
import { setAlignmentCommand, removeAlignmentCommand } from "./alignment-command";

export const alignmentPlugin = [
  alignmentParser,
  alignmentContainerNode,
  setAlignmentCommand,
  removeAlignmentCommand,
];
