import { Component, Input } from "@angular/core";
import { User } from "../widget-form-history.models";

@Component({
  selector: "app-user-editors",
  templateUrl: "./user-editors.component.html",
  styleUrls: ["./user-editors.component.scss"],
  standalone: true,
})
export class UserEditorsComponent {
  @Input() users: User[] = [];
}
