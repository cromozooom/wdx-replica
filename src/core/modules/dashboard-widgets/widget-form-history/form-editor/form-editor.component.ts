import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { JsonFormsAngularMaterialModule } from "@jsonforms/angular-material";
import { angularMaterialRenderers } from "@jsonforms/angular-material";
import {
  User,
  FormConfig,
  FormHistoryEntry,
} from "../widget-form-history.models";
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
    NgSelectModule,
    JsonFormsAngularMaterialModule,
  ],
})
export class FormEditorComponent implements AfterViewInit, OnInit, OnChanges {
  @Input() forms: FormConfig[] = [];
  @Input() selectedFormId: string | null = null;
  @Input() currentUserId: string | null = null;
  @Input() formHistory: { [formId: string]: FormHistoryEntry[] } = {};
  @Input() saveFormHistory: (entry: FormHistoryEntry) => void = () => {};

  @Input() schema: any = null;
  @Input() uischema: any = null;
  @Input() users: User[] = [];

  renderers = angularMaterialRenderers;
  jsonformsData: any = { name: "" };
  selectedFormIdLocal: string | null = null;
  selectedUserIdLocal: string | null = null;

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

  canRevert(): boolean {
    if (!this.selectedForm || !this.selectedUserIdLocal || !this.formHistory)
      return false;
    const formId = this.selectedForm.id;
    const userId = this.selectedUserIdLocal;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp,
      );
    return history.length > 1;
  }

  onRevert(): void {
    if (!this.selectedForm || !this.selectedUserIdLocal || !this.formHistory)
      return;
    const formId = this.selectedForm.id;
    const userId = this.selectedUserIdLocal;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp,
      );
    if (history.length > 1) {
      const prev = history[1];
      this.jsonformsData = { ...prev.data };
      // Register the revert as a manual save
      const entry: FormHistoryEntry = {
        id: Date.now().toString(),
        formId: formId,
        userId: userId ?? "",
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
    if (!this.selectedForm || !this.selectedUserIdLocal) return {};
    const formId = this.selectedForm.id;
    const userId = this.selectedUserIdLocal;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp,
      );
    return history[0]?.data || {};
  }

  onFormChange(event: Event) {
    const formId = (event.target as HTMLSelectElement)?.value;
    this.selectedFormIdLocal = formId;
    this.updateJsonForms();
  }

  updateJsonForms() {
    if (!this.selectedForm || !this.selectedForm.schema) {
      this.jsonformsData = {};
      return;
    }
    const data = { ...this.selectedFormData };
    this.jsonformsData = data;
  }

  onJsonFormsChange(event: any) {
    this.jsonformsData = event;
  }

  onFormFocusOut(event: FocusEvent) {
    if (!this.selectedForm || !this.selectedUserIdLocal) return;
    const formId = this.selectedForm.id;
    const userId = this.selectedUserIdLocal;
    const historyArr = this.formHistory[formId] || [];
    const history = historyArr
      .filter((h: FormHistoryEntry) => h.userId === userId)
      .sort(
        (a: FormHistoryEntry, b: FormHistoryEntry) => b.timestamp - a.timestamp,
      );
    const lastData = history[0]?.data || {};
    const isEqual = deepEqual(this.jsonformsData, lastData);
    if (isEqual) return;
    const entry: FormHistoryEntry = {
      id: Date.now().toString(),
      formId: formId,
      userId: userId ?? "",
      timestamp: Date.now(),
      data: { ...this.jsonformsData },
      saveType: "automatic",
      schema: this.selectedForm.schema,
      uischema: this.selectedForm.uischema,
    };
    if (this.saveFormHistory) {
      this.saveFormHistory(entry);
    }
  }

  onManualSave() {
    if (!this.selectedForm || !this.selectedUserIdLocal) return;
    const formId = this.selectedForm.id;
    const userId = this.selectedUserIdLocal;
    const entry: FormHistoryEntry = {
      id: Date.now().toString(),
      formId: formId,
      userId: userId ?? "",
      timestamp: Date.now(),
      data: { ...this.jsonformsData },
      saveType: "button",
      schema: this.selectedForm.schema,
      uischema: this.selectedForm.uischema,
    };
    if (this.saveFormHistory) {
      this.saveFormHistory(entry);
    }
  }

  ngOnInit() {
    this.selectedFormIdLocal =
      this.selectedFormId || (this.forms[0]?.id ?? null);
    this.selectedUserIdLocal = this.users[0]?.id ?? null;
    this.updateJsonForms();
  }

  ngAfterViewInit() {
    this.updateJsonForms();
  }

  ngOnChanges(changes: SimpleChanges) {
    let shouldReset = false;
    if (
      changes["selectedFormId"] &&
      changes["selectedFormId"].currentValue !==
        changes["selectedFormId"].previousValue
    ) {
      this.selectedFormIdLocal =
        this.selectedFormId || (this.forms[0]?.id ?? null);
      shouldReset = true;
    }
    if (
      changes["users"] &&
      changes["users"].currentValue !== changes["users"].previousValue
    ) {
      this.selectedUserIdLocal = this.users[0]?.id ?? null;
      shouldReset = true;
    }
    if (shouldReset) {
      this.updateJsonForms();
    }
  }

  // onUserChange removed: ng-select now uses only ngModel for id binding
}
