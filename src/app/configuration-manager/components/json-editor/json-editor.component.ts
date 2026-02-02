import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// JSONEditor will be loaded dynamically
declare var JSONEditor: any;

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss'],
})
export class JsonEditorComponent implements AfterViewInit, OnDestroy {
  @Input() value: string = '{}';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editorContainer', { static: false })
  editorContainer!: ElementRef;

  private editor: any;
  protected editorLoaded = false;

  async ngAfterViewInit(): Promise<void> {
    await this.loadEditor();
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  private async loadEditor(): Promise<void> {
    try {
      // Lazy load JSONEditor
      if (typeof JSONEditor === 'undefined') {
        // TODO: Implement dynamic import for jsoneditor library
        console.warn('JSONEditor not loaded. Using textarea fallback.');
        this.editorLoaded = false;
        return;
      }

      const container = this.editorContainer.nativeElement;
      const options = {
        mode: 'code',
        modes: ['code', 'tree', 'view'],
        onChange: () => {
          try {
            const json = this.editor.getText();
            this.valueChange.emit(json);
          } catch (error) {
            console.error('JSON parse error:', error);
          }
        },
      };

      this.editor = new JSONEditor(container, options);

      try {
        const initialValue = JSON.parse(this.value || '{}');
        this.editor.set(initialValue);
      } catch {
        this.editor.setText(this.value || '{}');
      }

      this.editorLoaded = true;
    } catch (error) {
      console.error('Failed to initialize JSON editor:', error);
      this.editorLoaded = false;
    }
  }

  updateValue(newValue: string): void {
    if (this.editor && this.editorLoaded) {
      try {
        const parsed = JSON.parse(newValue);
        this.editor.set(parsed);
      } catch {
        this.editor.setText(newValue);
      }
    }
  }
}
