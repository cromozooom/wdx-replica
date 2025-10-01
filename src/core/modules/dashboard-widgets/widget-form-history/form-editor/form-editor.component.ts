import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FilterByIdPipe } from "./filter-by-id.pipe";
import { NgSelectModule } from "@ng-select/ng-select";
import {
  JsonFormsAngularMaterialModule,
  angularMaterialRenderers,
} from "@jsonforms/angular-material";
import {
  User,
  FormConfig,
  FormHistoryEntry,
} from "../widget-form-history.models";

@Component({
  selector: "app-form-editor",
  templateUrl: "./form-editor.component.html",
  styleUrls: ["./form-editor.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterByIdPipe,
    NgSelectModule,
    JsonFormsAngularMaterialModule,
  ],
})
export class FormEditorComponent implements AfterViewInit {
  renderers = angularMaterialRenderers;
  @Input() users: User[] = [];
  @Input() forms: FormConfig[] = [];
  @Input() formHistory: FormHistoryEntry[] = [];
  @Input() currentUserId: string | null = null;
  @Input() selectedFormId: string | null = null;
  @Input() schema: any = null;
  @Input() uischema: any = null;

  selectedFormIdLocal: string | null = null;

  jsonformsData: any = {};

  ngOnInit() {
    this.selectedFormIdLocal =
      this.selectedFormId || (this.forms[0]?.id ?? null);
  }

  ngAfterViewInit() {
    this.updateJsonForms();
  }

  ngOnChanges() {
    // Keep selectedFormIdLocal in sync with selectedFormId
    if (this.selectedFormId !== this.selectedFormIdLocal) {
      this.selectedFormIdLocal =
        this.selectedFormId || (this.forms[0]?.id ?? null);
    }
    this.updateJsonForms();
  }

  get selectedForm() {
    return this.forms.find((f) => f.id === this.selectedFormIdLocal) || null;
  }

  get selectedFormData() {
    // Find the latest form data for the current user and selected form
    if (!this.selectedForm || !this.currentUserId) return {};
    const formId = this.selectedForm?.id;
    if (!formId) return {};
    const history = this.formHistory
      .filter((h) => h.formId === formId && h.userId === this.currentUserId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return history[0]?.data || {};
  }

  onFormChange(event: Event) {
    const formId = (event.target as HTMLSelectElement)?.value;
    this.selectedFormIdLocal = formId;
    this.updateJsonForms();
  }

  updateJsonForms() {
    if (!this.schema) {
      this.jsonformsData = {};
      return;
    }
    this.jsonformsData = { ...this.selectedFormData };
  }

  onJsonFormsChange(event: any) {
    if (event.data) {
      this.jsonformsData = event.data;
      // TODO: Save to history here
    }
  }
}
