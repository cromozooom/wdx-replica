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
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { cursor } from "@milkdown/plugin-cursor";

import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { pillPlugin, insertPillCommand } from "../../plugins/pill";
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

  @ViewChild("editorRef", { static: true }) editorElement!: ElementRef;

  private editor?: Editor;
  private contentChangeTimeout?: NodeJS.Timeout;

  constructor(private ngZone: NgZone) {}

  async ngAfterViewInit() {
    // Run Milkdown editor outside Angular zone for performance
    await this.ngZone.runOutsideAngular(() => this.initEditor());
  }

  ngOnDestroy() {
    if (this.contentChangeTimeout) {
      clearTimeout(this.contentChangeTimeout);
    }
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
        .use(pillPlugin)
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
    } catch (error) {
      console.error("Failed to initialize Milkdown editor:", error);
    }
  }

  private handlePillTrigger = (event: Event) => {
    // Emit event to show field selector
    // This will be handled by parent component
    this.ngZone.run(() => {
      // Trigger field selector appearance
      console.log(
        "Pill trigger detected at position:",
        (event as CustomEvent).detail?.position,
      );
    });
  };

  /**
   * Programmatically insert a pill node.
   */
  insertPill(field: DataField): void {
    this.editor?.action((ctx) => {
      const command = ctx.get(insertPillCommand.key);
      command(field.id);
    });
    this.pillInserted.emit(field);
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
