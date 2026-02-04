import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as monaco from "monaco-editor";

@Component({
  selector: "app-monaco-editor",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monaco-editor-container">
      <div #editorContainer class="editor"></div>
    </div>
  `,
  styles: [
    `
      .monaco-editor-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .editor {
        flex: 1;
        min-height: 400px;
      }
    `,
  ],
})
export class MonacoEditorComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() value: string = "";
  @Input() language: string = "json"; // json, xml, javascript, plaintext, etc.
  @Input() readOnly: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild("editorContainer", { static: false })
  editorContainer!: ElementRef;

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private model: monaco.editor.ITextModel | null = null;

  ngAfterViewInit(): void {
    this.initMonacoEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["value"] && this.editor && !changes["value"].firstChange) {
      const currentValue = this.editor.getValue();
      if (currentValue !== this.value) {
        this.editor.setValue(this.value || "");
      }
    }

    if (changes["language"] && this.model && !changes["language"].firstChange) {
      monaco.editor.setModelLanguage(this.model, this.language);
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
    }
    if (this.model) {
      this.model.dispose();
    }
  }

  private initMonacoEditor(): void {
    if (!this.editorContainer) return;

    // Create model
    this.model = monaco.editor.createModel(this.value || "", this.language);

    // Create editor
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      model: this.model,
      theme: "vs",
      automaticLayout: true,
      readOnly: this.readOnly,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      formatOnPaste: true,
      formatOnType: true,
    });

    // Listen to content changes
    this.editor.onDidChangeModelContent(() => {
      const newValue = this.editor?.getValue() || "";
      this.valueChange.emit(newValue);
    });
  }
}
