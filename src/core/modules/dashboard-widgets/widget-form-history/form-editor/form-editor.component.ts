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

type FormHistoryMap = { [formId: string]: FormHistoryEntry[] };
import { deepEqual } from "../deep-equal.util";
import { v4 as uuidv4 } from "uuid";

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
  @Input() formHistory: FormHistoryMap = {};
  @Input() currentUserId: string | null = null;
  @Input() selectedFormId: string | null = null;
  @Input() schema: any = null;
  @Input() uischema: any = null;

  // Minimal working schema and data for testing JSONForms
  testSchema = {
    type: "object",
    properties: {
      name: { type: "string", title: "Name" },
    },
  };
  testUiSchema = {
    type: "VerticalLayout",
    elements: [{ type: "Control", scope: "#/properties/name" }],
  };
  jsonformsData: any = { name: "" };

  selectedFormIdLocal: string | null = null;

  // Emits an event to parent to update formHistory
  @Input() saveFormHistory: (entry: FormHistoryEntry) => void = () => {};

  ngOnInit() {
    this.selectedFormIdLocal =
      this.selectedFormId || (this.forms[0]?.id ?? null);
    this.updateJsonForms();
  }

  ngAfterViewInit() {
    this.updateJsonForms();
  }

  ngOnChanges(changes: any) {
    // Always update form data from history when form or user changes
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

  onUserChange(userId: string) {
    this.currentUserId = userId;
    this.updateJsonForms();
  }
  // Returns true if there is a previous history entry to revert to
  canRevert(): boolean {
    if (!this.selectedForm || !this.currentUserId || !this.formHistory)
      return false;
    const formId = this.selectedForm.id;
    const userId = this.currentUserId;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    return history.length > 1;
  }

  // Revert to the previous state in history
  onRevert(): void {
    if (!this.selectedForm || !this.currentUserId || !this.formHistory) return;
    const formId = this.selectedForm.id;
    const userId = this.currentUserId;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    if (history.length > 1) {
      const prev = history[1];
      this.jsonformsData = { ...prev.data };
      // Register the revert as a manual save
      const entry: FormHistoryEntry = {
        id: Date.now().toString(),
        formId: formId,
        userId: userId,
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
    // Use real form selection logic
    return this.forms.find((f) => f.id === this.selectedFormIdLocal) || null;
  }

  get selectedFormData() {
    // Find the latest form data for the selected form and current user
    if (!this.selectedForm || !this.currentUserId) return {};
    const formId = this.selectedForm.id;
    const userId = this.currentUserId;
    console.log(
      "[FormEditor] Looking for formId in history:",
      formId,
      "userId:",
      userId
    );
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    console.log(
      "[FormEditor] Filtered history for formId",
      formId,
      "userId",
      userId,
      ":",
      history
    );
    return history[0]?.data || {};
  }

  onFormChange(event: Event) {
    const formId = (event.target as HTMLSelectElement)?.value;
    this.selectedFormIdLocal = formId;
    console.log("[FormEditor] Selected form id:", formId);
    this.updateJsonForms();
  }

  updateJsonForms() {
    // Always reset jsonformsData to the latest history data for the selected form/user
    if (!this.selectedForm || !this.selectedForm.schema) {
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
    console.log("[FormEditor] onJsonFormsChange event:", event);
    this.jsonformsData = event;
    // TODO: Save to history here
    // (Manual save can be implemented here if needed)
  }

  onFormFocusOut(event: FocusEvent) {
    // Save to history on out-of-focus (automatic save)
    if (!this.selectedForm || !this.currentUserId) return;
    // Find the last saved data for this form/user
    const formId = this.selectedForm.id;
    const userId = this.currentUserId;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp
      );
    const lastData = history[0]?.data || {};
    const isEqual = deepEqual(this.jsonformsData, lastData);
    console.log(
      "[FormEditor] Compare current vs lastData:",
      this.jsonformsData,
      lastData,
      "equal:",
      isEqual
    );
    if (isEqual) {
      // No change, do not save duplicate
      return;
    }
    const entry: FormHistoryEntry = {
      id: Date.now().toString(),
      formId: formId,
      userId: userId,
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
