import { Component, Input } from "@angular/core";
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
})
export class FormEditorComponent {
  @Input() users: User[] = [];
  @Input() forms: FormConfig[] = [];
  @Input() formHistory: FormHistoryEntry[] = [];
  @Input() currentUserId: string | null = null;
  @Input() selectedFormId: string | null = null;
}
