import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  NgZone,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";
import {
  Editor,
  rootCtx,
  editorViewOptionsCtx,
  editorViewCtx,
  parserCtx,
  serializerCtx,
} from "@milkdown/core";
import { commandsCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { cursor } from "@milkdown/plugin-cursor";
import { trailing } from "@milkdown/plugin-trailing";

import { listener, listenerCtx } from "@milkdown/plugin-listener";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertImageCommand,
  createCodeBlockCommand,
  insertHrCommand,
  turnIntoTextCommand,
} from "@milkdown/preset-commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/preset-gfm";
import {
  pillNode,
  pillInputRule,
  insertPillCommand,
  deletePillCommand,
  pillKeymap,
  pillParser,
} from "../../plugins/pill";
import {
  alignmentParser,
  alignmentContainerNode,
  setAlignmentCommand,
  removeAlignmentCommand,
} from "../../plugins/alignment";
import { DataField } from "../../models";

@Component({
  selector: "app-template-editor",
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: "./template-editor.component.html",
  styleUrls: ["./template-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent implements AfterViewInit, OnDestroy {
  private _content = "";
  private _availableFields: DataField[] = [];

  @Input()
  set content(value: string) {
    this._content = value;
    // Update editor if already initialized and content actually changed
    if (this.editor && value !== this.getContent()) {
      this.setContent(value);
    }
  }
  get content(): string {
    return this._content;
  }

  get availableFields(): DataField[] {
    return this._availableFields;
  }

  @Input()
  set availableFields(fields: DataField[]) {
    this._availableFields = fields;
    // Validate pills when fields change
    if (this.editor) {
      this.validatePills();
    }
  }
  @Input() readonly = false;

  @Output() contentChange = new EventEmitter<string>();
  @Output() pillInserted = new EventEmitter<DataField>();
  @Output() pillTrigger = new EventEmitter<{ position: number }>();
  @Output() pillClicked = new EventEmitter<{
    fieldId: string;
    position: number;
  }>();

  @ViewChild("editorRef", { static: true }) editorElement!: ElementRef;

  private editor?: Editor;
  private contentChangeTimeout?: NodeJS.Timeout;

  constructor(private ngZone: NgZone) {}

  async ngAfterViewInit() {
    // Ensure DOM is ready before initializing Milkdown
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Run Milkdown editor outside Angular zone for performance
    await this.ngZone.runOutsideAngular(() => this.initEditor());
  }

  ngOnDestroy() {
    if (this.contentChangeTimeout) {
      clearTimeout(this.contentChangeTimeout);
    }
    document.removeEventListener("pill-trigger", this.handlePillTrigger);
    this.editorElement?.nativeElement?.removeEventListener(
      "click",
      this.handlePillClick,
    );
    this.editor?.destroy();
  }

  private async initEditor(): Promise<void> {
    try {
      this.editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, this.editorElement.nativeElement);
          ctx.set(editorViewOptionsCtx, { editable: () => !this.readonly });
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(cursor)
        .use(trailing)
        .use(pillParser)
        .use(pillNode)
        .use(pillInputRule)
        .use(insertPillCommand)
        .use(deletePillCommand)
        .use(pillKeymap)
        .use(alignmentParser)
        .use(alignmentContainerNode)
        .use(setAlignmentCommand)
        .use(removeAlignmentCommand)
        .use(listener)
        .create();

      // Listen for content changes with 300ms debounce
      this.editor.action((ctx) => {
        const listenerPlugin = ctx.get(listenerCtx);

        listenerPlugin.markdownUpdated((ctx, markdown) => {
          if (this.contentChangeTimeout) {
            clearTimeout(this.contentChangeTimeout);
          }

          this.contentChangeTimeout = setTimeout(() => {
            this.ngZone.run(() => {
              this.contentChange.emit(markdown);
              // Validate pills after content change
              this.validatePills();
            });
          }, 300);
        });
      });

      // Set initial content
      if (this.content) {
        this.setContent(this.content);
      }

      // Validate pills after content is set
      setTimeout(() => this.validatePills(), 100);

      // Listen for pill trigger event
      document.addEventListener("pill-trigger", this.handlePillTrigger);

      // Listen for clicks on pill nodes (click-to-edit)
      this.editorElement.nativeElement.addEventListener(
        "click",
        this.handlePillClick,
      );
    } catch (error) {
      console.error("Failed to initialize Milkdown editor:", error);
      console.error("Error details:", error);
    }
  }

  private handlePillTrigger = (event: Event) => {
    // Emit event to show field selector
    this.ngZone.run(() => {
      const position = (event as CustomEvent).detail?.position || 0;
      this.pillTrigger.emit({ position });
    });
  };

  private handlePillClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if the clicked element is a pill node
    if (target && target.classList.contains("pill-node")) {
      const fieldId = target.getAttribute("data-field-id");

      if (fieldId) {
        // Get the position of the clicked pill in the document
        this.editor?.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const pos = view.posAtDOM(target, 0);

          this.ngZone.run(() => {
            this.pillClicked.emit({ fieldId, position: pos });
          });
        });
      }
    }
  };

  /**
   * Programmatically insert a pill node.
   */
  insertPill(field: DataField, position?: number | null): void {
    this.editor?.action((ctx) => {
      try {
        const commands = ctx.get(commandsCtx);
        commands.call(insertPillCommand.key, {
          fieldId: field.id,
          position,
        });
      } catch (error) {
        console.error("TemplateEditor: Error calling command:", error);
      }
    });

    this.pillInserted.emit(field);
  }

  /**
   * Toolbar methods for formatting
   */
  toggleBold(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(toggleStrongCommand.key);
    });
  }

  toggleItalic(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(toggleEmphasisCommand.key);
    });
  }

  toggleCode(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(toggleInlineCodeCommand.key);
    });
  }

  applyHeading(level: number): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(wrapInHeadingCommand.key, level);
    });
  }

  applyParagraph(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(turnIntoTextCommand.key);
    });
  }

  applyBulletList(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(wrapInBulletListCommand.key);
    });
  }

  applyOrderedList(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(wrapInOrderedListCommand.key);
    });
  }

  applyBlockquote(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(wrapInBlockquoteCommand.key);
    });
  }

  toggleStrikethrough(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(toggleStrikethroughCommand.key);
    });
  }

  toggleUnderline(): void {
    // Note: Underline is not part of standard Markdown.
    // This wraps selected text in HTML <u> tags.
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const { selection, tr } = state;
      const { from, to } = selection;

      if (from === to) return; // No selection

      const selectedText = state.doc.textBetween(from, to);

      // Check if already underlined
      if (selectedText.startsWith("<u>") && selectedText.endsWith("</u>")) {
        // Remove underline
        const unwrappedText = selectedText.slice(3, -4);
        const transaction = tr.replaceWith(
          from,
          to,
          state.schema.text(unwrappedText),
        );
        view.dispatch(transaction);
      } else {
        // Add underline
        const underlinedText = `<u>${selectedText}</u>`;
        const transaction = tr.replaceWith(
          from,
          to,
          state.schema.text(underlinedText),
        );
        view.dispatch(transaction);
      }
    });
  }

  insertTable(): void {
    const rows = prompt("Enter number of rows:", "3");
    const cols = prompt("Enter number of columns:", "3");

    if (rows && cols) {
      const rowCount = parseInt(rows, 10);
      const colCount = parseInt(cols, 10);

      if (isNaN(rowCount) || isNaN(colCount) || rowCount < 1 || colCount < 1) {
        alert("Please enter valid numbers for rows and columns (minimum 1)");
        return;
      }

      if (rowCount > 20 || colCount > 10) {
        if (
          !confirm(
            `Creating a ${rowCount}x${colCount} table. This might be large. Continue?`,
          )
        ) {
          return;
        }
      }

      this.editor?.action((ctx) => {
        ctx
          .get(commandsCtx)
          .call(insertTableCommand.key, { row: rowCount, col: colCount });
      });
    }
  }

  insertImage(): void {
    const url = prompt("Enter image URL:");
    const alt = prompt("Enter image alt text (optional):");
    if (url) {
      this.editor?.action((ctx) => {
        ctx.get(commandsCtx).call(insertImageCommand.key, {
          src: url,
          alt: alt || "",
          title: alt || "",
        });
      });
    }
  }

  insertCodeBlock(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(createCodeBlockCommand.key);
    });
  }

  insertHorizontalRule(): void {
    this.editor?.action((ctx) => {
      ctx.get(commandsCtx).call(insertHrCommand.key);
    });
  }

  /**
   * Apply text alignment using ProseMirror alignment container nodes.
   * Creates an alignment container that wraps the selected content.
   */
  applyAlignment(alignment: "left" | "center" | "right" | "justify"): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const { schema, selection } = state;
      const { $from, $to } = selection;

      // Get the alignment container node type
      const alignmentContainerType = schema.nodes["alignmentContainer"];
      if (!alignmentContainerType) {
        console.error("alignmentContainer node type not found in schema");
        return;
      }

      // Check if we're already inside an alignment container
      let depth = $from.depth;
      let existingAlignmentDepth = -1;

      while (depth > 0) {
        const node = $from.node(depth);
        if (node.type === alignmentContainerType) {
          existingAlignmentDepth = depth;
          break;
        }
        depth--;
      }

      if (existingAlignmentDepth > 0) {
        // Already in an alignment container
        const existingNode = $from.node(existingAlignmentDepth);
        const currentAlignment = existingNode.attrs["alignment"];

        if (currentAlignment === alignment) {
          // Same alignment - unwrap (remove alignment)
          const nodePos = $from.before(existingAlignmentDepth);
          const nodeEndPos = $from.after(existingAlignmentDepth);

          // Extract the content from inside the alignment container
          const slice = state.doc.slice(nodePos + 1, nodeEndPos - 1);
          const tr = state.tr.replaceRange(nodePos, nodeEndPos, slice);
          view.dispatch(tr);
        } else {
          // Different alignment - update the attribute
          console.log(
            `Changing alignment from ${currentAlignment} to ${alignment}`,
          );
          const nodePos = $from.before(existingAlignmentDepth);
          const tr = state.tr.setNodeMarkup(nodePos, null, { alignment });
          view.dispatch(tr);
        }
      } else {
        // Not in an alignment container - wrap the current block
        const range = $from.blockRange($to);

        if (!range) {
          console.warn("No valid block range for alignment");
          return;
        }

        // Use ProseMirror's wrap command logic
        const wrapping = alignmentContainerType.contentMatch.findWrapping(
          state.doc.resolve(range.start).parent.type,
        );

        if (wrapping) {
          // Can wrap directly
          const tr = state.tr.wrap(range, [
            { type: alignmentContainerType, attrs: { alignment } },
          ]);
          view.dispatch(tr);
        } else {
          // Create alignment container and move content into it
          const slice = state.doc.slice(range.start, range.end);
          const alignmentNode = alignmentContainerType.create(
            { alignment },
            slice.content,
          );

          // Replace the range with the alignment container
          const tr = state.tr.replaceRangeWith(
            range.start,
            range.end,
            alignmentNode,
          );
          view.dispatch(tr);
        }
      }
    });
  }

  /**
   * Remove alignment (unwrap from alignment container).
   * This is now handled by clicking the same alignment button again.
   */
  removeAlignment(): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const { schema, selection } = state;
      const { $from } = selection;

      const alignmentContainerType = schema.nodes["alignmentContainer"];
      if (!alignmentContainerType) return;

      // Find if we're inside an alignment container
      let depth = $from.depth;
      let alignmentDepth = -1;

      while (depth > 0) {
        const node = $from.node(depth);
        if (node.type === alignmentContainerType) {
          alignmentDepth = depth;
          break;
        }
        depth--;
      }

      if (alignmentDepth > 0) {
        // Unwrap the alignment container
        const nodePos = $from.before(alignmentDepth);
        const nodeEndPos = $from.after(alignmentDepth);
        const slice = state.doc.slice(nodePos + 1, nodeEndPos - 1);
        const tr = state.tr.replaceRange(nodePos, nodeEndPos, slice);
        view.dispatch(tr);
      }
    });
  }

  /**
   * Validate all pills in the editor and mark invalid ones.
   * Invalid pills are those whose fieldId doesn't exist in availableFields.
   */
  private validatePills(): void {
    if (!this.editorElement) return;

    // Get all pill nodes from the DOM
    const pillNodes =
      this.editorElement.nativeElement.querySelectorAll(".pill-node");

    // Create a set of valid field IDs for quick lookup
    const validFieldIds = new Set(this._availableFields.map((f) => f.id));

    pillNodes.forEach((pill: Element) => {
      const fieldId = pill.getAttribute("data-field-id");

      if (fieldId && !validFieldIds.has(fieldId)) {
        // Invalid field - add warning class
        pill.classList.add("pill-invalid");
      } else {
        // Valid field - remove warning class if present
        pill.classList.remove("pill-invalid");
      }
    });
  }

  /**
   * Replace an existing pill node with a new one.
   */
  replacePill(oldFieldId: string, newField: DataField, position: number): void {
    this.editor?.action((ctx) => {
      try {
        const view = ctx.get(editorViewCtx);
        const { state } = view;
        const { schema, tr } = state;

        // Find the pill node at the given position
        const $pos = state.doc.resolve(position);
        const node = $pos.nodeAfter;

        if (node && node.type.name === "pill") {
          // Delete the old pill
          const deleteFrom = position;
          const deleteTo = position + node.nodeSize;

          // Create the new pill
          const newPill = schema.nodes["pill"].create({ fieldId: newField.id });

          // Replace in one transaction
          const transaction = tr.replaceWith(deleteFrom, deleteTo, newPill);

          view.dispatch(transaction);
        } else {
          console.error("TemplateEditor: No pill found at position", position);
        }
      } catch (error) {
        console.error("TemplateEditor: Error replacing pill:", error);
      }
    });

    this.pillInserted.emit(newField);
  }

  /**
   * Focus the editor.
   */
  focus(): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
    });
  }

  /**
   * Get current markdown content.
   */
  getContent(): string {
    let markdown = "";
    this.editor?.action((ctx) => {
      const serializer = ctx.get(serializerCtx);
      const doc = ctx.get(editorViewCtx).state.doc;

      markdown = serializer(doc);
    });
    return markdown;
  }

  /**
   * Set editor content.
   */
  setContent(content: string): void {
    this.editor?.action((ctx) => {
      const parser = ctx.get(parserCtx);
      const view = ctx.get(editorViewCtx);
      const doc = parser(content);
      if (doc) {
        const tr = view.state.tr.replaceWith(
          0,
          view.state.doc.content.size,
          doc.content,
        );
        view.dispatch(tr);
      }
    });
    // Validate pills after content is set
    setTimeout(() => this.validatePills(), 100);
  }
}
