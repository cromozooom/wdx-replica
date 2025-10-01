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
export class WidgetFormHistoryComponent {
  active = 2;

  state = signal({
    users: [] as User[],
    forms: [
      {
        id: "f1",
        name: "Employee Form",
        formConfig: {
          schema: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
          },
        },
      },
      {
        id: "f2",
        name: "Feedback Form",
        formConfig: {
          schema: {
            type: "object",
            properties: { feedback: { type: "string" } },
          },
        },
      },
    ] as FormConfig[],
    formHistory: [
      {
        id: "h1",
        formId: "f1",
        userId: "1",
        timestamp: Date.now() - 100000,
        data: { name: "Alice", age: 30 },
        saveType: "button",
      },
      {
        id: "h2",
        formId: "f2",
        userId: "2",
        timestamp: Date.now() - 50000,
        data: { feedback: "Great!" },
        saveType: "automatic",
      },
    ] as FormHistoryEntry[],
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
    // Sync users to localStorage on state change
    effect(() => {
      const users = this.state().users;
      localStorage.setItem("widgetUsers", JSON.stringify(users));
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
    this.state.update((s) => ({
      ...s,
      forms: [...s.forms, form],
    }));
  }

  handleRemoveUser(userId: string) {
    this.state.update((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
      currentUserId: s.currentUserId === userId ? null : s.currentUserId,
    }));
  }
}
