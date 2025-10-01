import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormConfig } from "../widget-form-history.models";
import JSONEditor from "jsoneditor";

@Component({
  selector: "app-form-creator",
  templateUrl: "./form-creator.component.html",
  styleUrls: ["./form-creator.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class FormCreatorComponent implements AfterViewInit {
  showValidation = false;
  schemaValid = true;
  uiSchemaValid = true;
  @Input() forms: FormConfig[] = [];
  @Output() addForm = new EventEmitter<FormConfig>();
  @Output() removeForm = new EventEmitter<string>();
  onRemoveForm(formId: string) {
    this.removeForm.emit(formId);
  }

  formName = "";
  editor: any = null;
  uiEditor: any = null;
  @ViewChild("jsonEditorContainer", { static: false })
  jsonEditorContainer!: ElementRef;
  @ViewChild("uiJsonEditorContainer", { static: false })
  uiJsonEditorContainer!: ElementRef;

  ngAfterViewInit() {
    this.editor = new JSONEditor(this.jsonEditorContainer.nativeElement, {
      mode: "code",
      modes: ["code", "tree"],
      onChange: () => {},
    });
    this.uiEditor = new JSONEditor(this.uiJsonEditorContainer.nativeElement, {
      mode: "code",
      modes: ["code", "tree"],
      onChange: () => {},
    });
    // Set default schema and uischema
    this.editor.set({ type: "object", properties: {} });
    this.uiEditor.set({ type: "VerticalLayout", elements: [] });
  }

  onAddForm() {
    this.showValidation = true;
    this.schemaValid = true;
    this.uiSchemaValid = true;
    if (!this.formName.trim() || !this.editor || !this.uiEditor) return;
    let schema: any;
    let uischema: any;
    try {
      schema = this.editor.get();
    } catch {
      this.schemaValid = false;
    }
    try {
      uischema = this.uiEditor.get();
    } catch {
      this.uiSchemaValid = false;
    }
    if (!this.formName.trim() || !schema || !uischema) return;
    const newForm = {
      id: Date.now().toString(),
      name: this.formName,
      schema,
      uischema,
    };
    // Save to localStorage
    const stored = localStorage.getItem("widgetForms");
    let forms = [];
    if (stored) {
      try {
        forms = JSON.parse(stored);
      } catch {}
    }
    forms.push(newForm);
    localStorage.setItem("widgetForms", JSON.stringify(forms));
    this.addForm.emit(newForm);
    this.formName = "";
    this.editor.set({ type: "object", properties: {} });
    this.uiEditor.set({ type: "VerticalLayout", elements: [] });
    this.showValidation = false;
    this.schemaValid = true;
    this.uiSchemaValid = true;
  }
}
