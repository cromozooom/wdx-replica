import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as monaco from "monaco-editor";

@Component({
  selector: "app-monaco-diff-viewer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monaco-diff-container">
      <div #diffEditor class="diff-editor"></div>
    </div>
  `,
  styles: [
    `
      .monaco-diff-container {
        border: 1px solid #dee2e6;
        border-radius: 4px;
        overflow: hidden;
        height: 500px;
        background: white;
      }

      .diff-editor {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MonacoDiffViewerComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() leftValue: string = "";
  @Input() rightValue: string = "";
  @Input() language: string = "json"; // json, xml, javascript, plaintext

  @ViewChild("diffEditor", { static: false })
  diffEditorContainer!: ElementRef;

  private diffEditor: monaco.editor.IStandaloneDiffEditor | null = null;

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes["leftValue"] || changes["rightValue"] || changes["language"]) &&
      this.diffEditor
    ) {
      this.updateContent();
    }
  }

  ngOnDestroy(): void {
    if (this.diffEditor) {
      this.diffEditor.dispose();
    }
  }

  private initEditor(): void {
    if (!this.diffEditorContainer) return;

    const originalModel = monaco.editor.createModel(
      this.leftValue,
      this.language,
    );
    const modifiedModel = monaco.editor.createModel(
      this.rightValue,
      this.language,
    );

    this.diffEditor = monaco.editor.createDiffEditor(
      this.diffEditorContainer.nativeElement,
      {
        automaticLayout: true,
        readOnly: true,
        renderSideBySide: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        originalEditable: false,
        diffWordWrap: "on",
      },
    );

    this.diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
  }

  private updateContent(): void {
    if (!this.diffEditor) return;

    const models = this.diffEditor.getModel();
    if (models) {
      models.original.setValue(this.leftValue);
      models.modified.setValue(this.rightValue);

      monaco.editor.setModelLanguage(models.original, this.language);
      monaco.editor.setModelLanguage(models.modified, this.language);
    }
  }
}
