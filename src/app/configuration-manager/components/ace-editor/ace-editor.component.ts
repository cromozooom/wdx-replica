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

// Ace will be loaded dynamically
declare var ace: any;

@Component({
  selector: 'app-ace-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ace-editor.component.html',
  styleUrls: ['./ace-editor.component.scss'],
})
export class AceEditorComponent implements AfterViewInit, OnDestroy {
  @Input() value: string = '';
  @Input() mode: 'xml' | 'text' = 'xml';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editorContainer', { static: false })
  editorContainer!: ElementRef;

  private editor: any;
  private editorLoaded = false;

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
      // Lazy load Ace Editor
      if (typeof ace === 'undefined') {
        // TODO: Implement dynamic import for ace-builds library
        console.warn('Ace Editor not loaded. Using textarea fallback.');
        this.editorLoaded = false;
        return;
      }

      const container = this.editorContainer.nativeElement;
      this.editor = ace.edit(container);

      this.editor.setTheme('ace/theme/monokai');
      this.editor.session.setMode(`ace/mode/${this.mode}`);
      this.editor.setValue(this.value || '', -1);

      this.editor.on('change', () => {
        const value = this.editor.getValue();
        this.valueChange.emit(value);
      });

      this.editorLoaded = true;
    } catch (error) {
      console.error('Failed to initialize Ace editor:', error);
      this.editorLoaded = false;
    }
  }

  updateValue(newValue: string): void {
    if (this.editor && this.editorLoaded) {
      const cursorPosition = this.editor.getCursorPosition();
      this.editor.setValue(newValue, -1);
      this.editor.moveCursorToPosition(cursorPosition);
    }
  }
}
