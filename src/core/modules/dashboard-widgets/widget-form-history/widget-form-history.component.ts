import { Component, signal } from "@angular/core";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

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
  imports: [NgbNavModule],
})
export class WidgetFormHistoryComponent {
  active = 1;

  // --- Single Signal Store ---
  state = signal({
    users: [] as User[],
    forms: [] as FormConfig[],
    formHistory: [] as FormHistoryEntry[],
    currentUserId: null as string | null,
    selectedFormId: null as string | null,
  });
}
