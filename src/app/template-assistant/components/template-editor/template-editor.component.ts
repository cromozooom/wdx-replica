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

import { listener, listenerCtx } from "@milkdown/plugin-listener";
import {
  pillNode,
  pillInputRule,
  insertPillCommand,
  deletePillCommand,
  pillKeymap,
} from "../../plugins/pill";
import { DataField } from "../../models";

@Component({
  selector: "app-template-editor",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./template-editor.component.html",
  styleUrls: ["./template-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent implements AfterViewInit, OnDestroy {
  @Input() content = "";
  @Input() availableFields: DataField[] = [];
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
      console.log("Initializing Milkdown editor...");
      console.log("Editor element:", this.editorElement.nativeElement);

      this.editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, this.editorElement.nativeElement);
          ctx.set(editorViewOptionsCtx, { editable: () => !this.readonly });
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(cursor)
        .use(pillNode)
        .use(pillInputRule)
        .use(insertPillCommand)
        .use(deletePillCommand)
        .use(pillKeymap)
        .use(listener)
        .create();

      console.log("Milkdown editor created successfully");

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
            });
          }, 300);
        });
      });

      // Set initial content
      if (this.content) {
        this.setContent(this.content);
      }

      // Listen for pill trigger event
      document.addEventListener("pill-trigger", this.handlePillTrigger);

      // Listen for clicks on pill nodes (click-to-edit)
      this.editorElement.nativeElement.addEventListener(
        "click",
        this.handlePillClick,
      );

      console.log("Editor initialized and ready");
    } catch (error) {
      console.error("Failed to initialize Milkdown editor:", error);
      console.error("Error details:", error);
    }
  }

  private handlePillTrigger = (event: Event) => {
    // Emit event to show field selector
    this.ngZone.run(() => {
      const position = (event as CustomEvent).detail?.position || 0;
      console.log("Pill trigger detected at position:", position);
      this.pillTrigger.emit({ position });
    });
  };

  private handlePillClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if the clicked element is a pill node
    if (target && target.classList.contains("pill-node")) {
      const fieldId = target.getAttribute("data-field-id");

      if (fieldId) {
        console.log("Pill clicked:", fieldId);

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
  insertPill(field: DataField): void {
    console.log("TemplateEditor: insertPill called with field:", field);

    this.editor?.action((ctx) => {
      console.log("TemplateEditor: Calling command through commandsCtx...");
      try {
        const commands = ctx.get(commandsCtx);
        console.log("TemplateEditor: Commands context:", commands);
        console.log(
          "TemplateEditor: Calling insertPill with fieldId:",
          field.id,
        );
        const result = commands.call(insertPillCommand.key, field.id);
        console.log("TemplateEditor: Command result:", result);
      } catch (error) {
        console.error("TemplateEditor: Error calling command:", error);
      }
    });

    console.log("TemplateEditor: Emitting pillInserted event");
    this.pillInserted.emit(field);
  }

  /**
   * Replace an existing pill node with a new one.
   */
  replacePill(oldFieldId: string, newField: DataField, position: number): void {
    console.log("TemplateEditor: replacePill called", {
      oldFieldId,
      newField,
      position,
    });

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
          console.log("TemplateEditor: Pill replaced successfully");
        } else {
          console.error("TemplateEditor: No pill found at position", position);
        }
      } catch (error) {
        console.error("TemplateEditor: Error replacing pill:", error);
      }
    });

    console.log("TemplateEditor: Emitting pillInserted event");
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
      markdown = serializer(ctx.get(editorViewCtx).state.doc);
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
  }
}
