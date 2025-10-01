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
import { JsonFormsAngularMaterialModule } from "@jsonforms/angular-material";
import { angularMaterialRenderers } from "@jsonforms/angular-material";
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

  // Emits an event to parent to update formHistory
  @Input() saveFormHistory: (entry: FormHistoryEntry) => void = () => {};

  ngOnInit() {
    this.selectedFormIdLocal =
      this.selectedFormId || (this.forms[0]?.id ?? null);
  }

  ngAfterViewInit() {
    this.updateJsonForms();
  }

  ngOnChanges(changes: any) {
    // Only reset jsonformsData if the selected form or user actually changed
    let shouldReset = false;
    if (
      changes.selectedFormId &&
      changes.selectedFormId.currentValue !==
        changes.selectedFormId.previousValue
    ) {
      this.selectedFormIdLocal =
        this.selectedFormId || (this.forms[0]?.id ?? null);
      shouldReset = true;
    }
    if (
      changes.currentUserId &&
      changes.currentUserId.currentValue !== changes.currentUserId.previousValue
    ) {
      shouldReset = true;
    }
    if (shouldReset) {
      this.updateJsonForms();
    }
  }
  // Returns true if there is a previous history entry to revert to
  canRevert(): boolean {
    if (!this.selectedForm || !this.currentUserId || !this.formHistory)
      return false;
    const history = (this.formHistory as FormHistoryEntry[])
      .filter(
        (h: FormHistoryEntry) =>
          h.formId === this.selectedForm!.id && h.userId === this.currentUserId
      )
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    return history.length > 1;
  }

  // Revert to the previous state in history
  onRevert(): void {
    if (!this.selectedForm || !this.currentUserId || !this.formHistory) return;
    const history = (this.formHistory as FormHistoryEntry[])
      .filter(
        (h: FormHistoryEntry) =>
          h.formId === this.selectedForm!.id && h.userId === this.currentUserId
      )
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    if (history.length > 1) {
      const prev = history[1];
      this.jsonformsData = { ...prev.data };
      // Register the revert as a manual save
      const entry: FormHistoryEntry = {
        id: Date.now().toString(),
        formId: this.selectedForm.id,
        userId: this.currentUserId,
        timestamp: Date.now(),
        data: { ...prev.data },
        saveType: "button",
        schema: this.selectedForm.schema,
        uischema: this.selectedForm.uischema,
      };
      if (this.saveFormHistory) {
        this.saveFormHistory(entry);
      }
    }
  }

  get selectedForm() {
    return this.forms.find((f) => f.id === this.selectedFormIdLocal) || null;
  }

  get selectedFormData() {
    // Find the latest form data for the selected form (any user)
    if (!this.selectedForm) return {};
    const formId = this.selectedForm?.id;
    if (!formId) return {};
    const history = this.formHistory
      .filter((h) => h.formId === formId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return history[0]?.data || {};
  }

  onFormChange(event: Event) {
    const formId = (event.target as HTMLSelectElement)?.value;
    this.selectedFormIdLocal = formId;
    // Log all history entries for this form (all users)
    const allHistory = this.formHistory
      .filter((h) => h.formId === formId)
      .sort((a, b) => b.timestamp - a.timestamp);
    const selectedForm = this.forms.find((f) => f.id === formId);
    const schema = selectedForm?.schema;
    const uischema = selectedForm?.uischema;
    const data = allHistory[0]?.data || {};
    console.log("[FormEditor] JSONForms schema:", schema);
    console.log("[FormEditor] JSONForms uischema:", uischema);
    console.log("[FormEditor] JSONForms data:", data);
    this.updateJsonForms();
  }

  updateJsonForms() {
    if (!this.schema) {
      this.jsonformsData = {};
      return;
    }
    const data = { ...this.selectedFormData };
    console.log("[FormEditor] Loading data for form/user:", {
      formId: this.selectedForm?.id,
      userId: this.currentUserId,
      data,
    });
    this.jsonformsData = data;
  }

  onJsonFormsChange(event: any) {
    if (event.data) {
      this.jsonformsData = event.data;
      // TODO: Save to history here
      // (Manual save can be implemented here if needed)
    }
  }

  onFormFocusOut(event: FocusEvent) {
    // Save to history on out-of-focus (automatic save)
    if (!this.selectedForm || !this.currentUserId) return;
    const entry: FormHistoryEntry = {
      id: Date.now().toString(),
      formId: this.selectedForm.id,
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { ...this.jsonformsData },
      saveType: "automatic",
      schema: this.selectedForm.schema,
      uischema: this.selectedForm.uischema,
    };
    console.log("[FormEditor] Saving to history:", entry);
    if (this.saveFormHistory) {
      this.saveFormHistory(entry);
    }
  }
}
