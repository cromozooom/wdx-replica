/**
 * Pill node schema for Milkdown.
 * Represents atomic data field placeholders in templates.
 */

import { $node } from "@milkdown/utils";

/**
 * Pill node definition with atomic property.
 * Pills cannot be partially edited - they are treated as single units.
 */
export const pillNode = $node("pill", () => ({
  group: "inline",
  inline: true,
  atom: true, // Prevents cursor from entering the node
  attrs: {
    fieldId: { default: "" },
  },
  parseDOM: [
    {
      tag: 'span[data-type="pill"]',
      getAttrs: (dom: HTMLElement) => ({
        fieldId: dom.getAttribute("data-field-id") || "",
      }),
    },
  ],
  toDOM: (node: any) => {
    return [
      "span",
      {
        "data-type": "pill",
        "data-field-id": node.attrs["fieldId"],
        class: "pill-node",
        contenteditable: "false",
      },
      node.attrs["fieldId"],
    ];
  },
  parseMarkdown: {
    match: (node: any) => node.type === "pill",
    runner: (state: any, node: any, type: any) => {
      state.addNode(type, { fieldId: node.value });
    },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === "pill",
    runner: (state: any, node: any) => {
      state.addNode("text", undefined, `{{${node.attrs["fieldId"]}}}`);
    },
  },
}));
