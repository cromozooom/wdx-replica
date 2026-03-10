/**
 * Barrel export for pill plugin.
 * Composes all pill-related functionality for Milkdown editor.
 */

export { pillNode } from "./pill-node";
export { pillInputRule } from "./pill-inputrule";
export { insertPillCommand, deletePillCommand } from "./pill-command";
export { pillMarkdownPlugin } from "./pill-markdown";

/**
 * Complete pill plugin for Milkdown.
 * Usage: editor.use(pillPlugin)
 */
import { pillNode } from "./pill-node";
import { pillInputRule } from "./pill-inputrule";
import { insertPillCommand, deletePillCommand } from "./pill-command";
import { pillMarkdownPlugin } from "./pill-markdown";

export const pillPlugin = [
  pillNode,
  pillInputRule,
  insertPillCommand,
  deletePillCommand,
  ...pillMarkdownPlugin,
];
