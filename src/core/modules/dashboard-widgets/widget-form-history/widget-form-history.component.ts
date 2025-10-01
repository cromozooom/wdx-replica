import { Component, signal } from "@angular/core";
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
  active = 1;

  // --- Single Signal Store ---
  state = signal({
    users: [
      {
        id: "1",
        name: "Alice",
        role: "admin",
        current: true,
      },
      {
        id: "2",
        name: "Bob",
        role: "default",
        current: false,
      },
    ] as User[],
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
    currentUserId: "1" as string | null,
    selectedFormId: "f1" as string | null,
  });
}
