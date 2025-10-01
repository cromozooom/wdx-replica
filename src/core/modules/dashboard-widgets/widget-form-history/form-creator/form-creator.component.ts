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
  @Input() forms: FormConfig[] = [];
  @Output() addForm = new EventEmitter<FormConfig>();

  formName = "";
  editor: any = null;
  @ViewChild("jsonEditorContainer", { static: false })
  jsonEditorContainer!: ElementRef;

  ngAfterViewInit() {
    this.editor = new JSONEditor(this.jsonEditorContainer.nativeElement, {
      mode: "code",
      modes: ["code", "tree"],
      onChange: () => {},
    });
    // Set default schema
    this.editor.set({ schema: { type: "object", properties: {} } });
  }

  onAddForm() {
    if (!this.formName.trim() || !this.editor) return;
    let formConfig: any;
    try {
      formConfig = this.editor.get();
    } catch {
      alert("Invalid JSON");
      return;
    }
    this.addForm.emit({
      id: Date.now().toString(),
      name: this.formName,
      formConfig,
    });
    this.formName = "";
    this.editor.set({ schema: { type: "object", properties: {} } });
  }
}
