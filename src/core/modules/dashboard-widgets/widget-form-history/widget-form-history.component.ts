import { OnInit } from "@angular/core";
import { Component, signal, effect } from "@angular/core";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

import { FormEditorComponent } from "./form-editor/form-editor.component";
import { FormCreatorComponent } from "./form-creator/form-creator.component";
import { UserEditorsComponent } from "./user-editors/user-editors.component";

import {
  User,
  FormConfig,
  FormHistoryEntry,
} from "./widget-form-history.models";

type FormHistoryMap = { [formId: string]: FormHistoryEntry[] };

@Component({
  selector: "app-widget-form-history",
  templateUrl: "./widget-form-history.component.html",
  styleUrls: ["./widget-form-history.component.scss"],
  standalone: true,
  imports: [
    NgbNavModule,
    FormEditorComponent,
    FormCreatorComponent,
    UserEditorsComponent,
  ],
})
export class WidgetFormHistoryComponent implements OnInit {
  get selectedForm() {
    return (
      this.state().forms.find((f) => f.id === this.state().selectedFormId) ||
      null
    );
  }
  get selectedFormSchema() {
    return this.selectedForm?.schema;
  }
  get selectedFormUiSchema() {
    return this.selectedForm?.uischema;
  }
  ngOnInit() {
    // Fix ExpressionChangedAfterItHasBeenCheckedError by ensuring selectedFormId is set after forms are loaded
    if (!this.state().selectedFormId && this.state().forms.length > 0) {
      this.state.update((s) => ({ ...s, selectedFormId: s.forms[0].id }));
    }
  }
  handleRemoveForm(formId: string) {
    this.state.update((s) => {
      const forms = s.forms.filter((f) => f.id !== formId);
      let selectedFormId = s.selectedFormId;
      if (selectedFormId === formId) {
        selectedFormId = forms.length > 0 ? forms[0].id : null;
      }
      return {
        ...s,
        forms,
        selectedFormId,
      };
    });
  }
  active = 1;

  state = signal({
    users: [] as User[],
    forms: [] as FormConfig[],
    formHistory: {} as FormHistoryMap,
    currentUserId: null as string | null,
    selectedFormId: "f1" as string | null,
  });

  constructor() {
    // Load users from localStorage if available
    const usersJson = localStorage.getItem("widgetUsers");
    if (usersJson) {
      try {
        const users = JSON.parse(usersJson);
        this.state.update((s) => ({ ...s, users }));
      } catch {}
    } else {
      // If no users in storage, set some demo users
      this.state.update((s) => ({
        ...s,
        users: [
          { id: "1", name: "Alice", role: "admin", current: true },
          { id: "2", name: "Bob", role: "default", current: false },
        ],
        currentUserId: "1",
      }));
    }

    // Load forms from localStorage if available, otherwise add default sample form
    const formsJson = localStorage.getItem("widgetForms");
    if (formsJson) {
      try {
        const forms = JSON.parse(formsJson);
        this.state.update((s) => ({ ...s, forms }));
      } catch {}
    } else {
      // Add default sample form
      this.state.update((s) => ({
        ...s,
        forms: [
          {
            id: "123456789",
            name: "Sample Form",
            schema: {
              type: "object",
              required: ["age"],
              properties: {
                firstName: { type: "string", minLength: 2, maxLength: 20 },
                lastName: { type: "string", minLength: 5, maxLength: 15 },
                age: { type: "integer", minimum: 18, maximum: 100 },
                gender: {
                  type: "string",
                  enum: ["Male", "Female", "Undisclosed"],
                },
                height: { type: "number" },
                dateOfBirth: { type: "string", format: "date" },
                rating: { type: "integer" },
                committer: { type: "boolean" },
                address: {
                  type: "object",
                  properties: {
                    street: { type: "string" },
                    streetnumber: { type: "string" },
                    postalCode: { type: "string" },
                    city: { type: "string" },
                  },
                },
              },
            },
            uischema: {
              type: "VerticalLayout",
              elements: [
                {
                  type: "HorizontalLayout",
                  elements: [
                    { type: "Control", scope: "#/properties/firstName" },
                    { type: "Control", scope: "#/properties/lastName" },
                  ],
                },
                {
                  type: "HorizontalLayout",
                  elements: [
                    { type: "Control", scope: "#/properties/age" },
                    { type: "Control", scope: "#/properties/dateOfBirth" },
                  ],
                },
                {
                  type: "HorizontalLayout",
                  elements: [
                    { type: "Control", scope: "#/properties/height" },
                    { type: "Control", scope: "#/properties/gender" },
                    { type: "Control", scope: "#/properties/committer" },
                  ],
                },
                {
                  type: "Group",
                  label: "Address for Shipping T-Shirt",
                  elements: [
                    {
                      type: "HorizontalLayout",
                      elements: [
                        {
                          type: "Control",
                          scope: "#/properties/address/properties/street",
                        },
                        {
                          type: "Control",
                          scope: "#/properties/address/properties/streetnumber",
                        },
                      ],
                    },
                    {
                      type: "HorizontalLayout",
                      elements: [
                        {
                          type: "Control",
                          scope: "#/properties/address/properties/postalCode",
                        },
                        {
                          type: "Control",
                          scope: "#/properties/address/properties/city",
                        },
                      ],
                    },
                  ],
                  rule: {
                    effect: "ENABLE",
                    condition: {
                      scope: "#/properties/committer",
                      schema: { const: true },
                    },
                  },
                },
              ],
            },
          },
        ],
      }));
    }

    // Load formHistory from localStorage if available
    const historyJson = localStorage.getItem("widgetFormHistory");
    if (historyJson) {
      try {
        const formHistory = JSON.parse(historyJson);
        this.state.update((s) => ({ ...s, formHistory }));
      } catch {}
    }

    // Sync users to localStorage on state change
    effect(() => {
      const users = this.state().users;
      localStorage.setItem("widgetUsers", JSON.stringify(users));
    });

    // Sync forms to localStorage on state change
    effect(() => {
      const forms = this.state().forms;
      localStorage.setItem("widgetForms", JSON.stringify(forms));
    });

    // Sync formHistory to localStorage on state change
    effect(() => {
      const formHistory = this.state().formHistory;
      localStorage.setItem("widgetFormHistory", JSON.stringify(formHistory));
    });
  }

  handleAddUser(user: Omit<User, "id">) {
    const id = Date.now().toString();
    const newUser: User = { ...user, id };
    this.state.update((s) => {
      let users = [...s.users, newUser];
      let currentUserId = s.currentUserId;
      if (user.current) {
        users = users.map((u) => ({ ...u, current: u.id === id }));
        currentUserId = id;
      }
      return {
        ...s,
        users,
        currentUserId,
      };
    });
  }

  handleEditUser(user: User) {
    this.state.update((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === user.id ? { ...user } : u)),
    }));
  }

  handleSetCurrentUser(userId: string) {
    this.state.update((s) => ({
      ...s,
      users: s.users.map((u) => ({ ...u, current: u.id === userId })),
      currentUserId: userId,
    }));
  }

  handleAddForm(form: FormConfig) {
    // Flatten schema/uischema if nested in formConfig
    let newForm: FormConfig = form;
    if (
      form.formConfig &&
      (form.formConfig.schema || form.formConfig.uischema)
    ) {
      newForm = {
        ...form,
        formConfig: undefined,
        schema: form.formConfig.schema,
        uischema: form.formConfig.uischema,
      };
    }
    this.state.update((s) => ({
      ...s,
      forms: [...s.forms, newForm],
    }));
  }

  handleRemoveUser(userId: string) {
    this.state.update((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
      currentUserId: s.currentUserId === userId ? null : s.currentUserId,
    }));
  }
  // (duplicate removed)
  // Save a new form history entry
  handleSaveFormHistory = (entry: FormHistoryEntry) => {
    this.state.update((s) => {
      const formHistory = { ...s.formHistory };
      if (!formHistory[entry.formId]) {
        formHistory[entry.formId] = [];
      }
      formHistory[entry.formId] = [entry, ...formHistory[entry.formId]];
      return {
        ...s,
        formHistory,
      };
    });
  };
}
