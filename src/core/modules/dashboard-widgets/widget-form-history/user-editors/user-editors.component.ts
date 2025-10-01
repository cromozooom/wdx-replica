import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { User } from "../widget-form-history.models";

@Component({
  selector: "app-user-editors",
  templateUrl: "./user-editors.component.html",
  styleUrls: ["./user-editors.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class UserEditorsComponent {
  @Input() users: User[] = [];

  @Output() addUser = new EventEmitter<Omit<User, "id">>();
  @Output() editUser = new EventEmitter<User>();
  @Output() setCurrentUser = new EventEmitter<string>();
  @Output() removeUser = new EventEmitter<string>();
  onRemoveUser(userId: string) {
    this.removeUser.emit(userId);
  }

  newUser: Omit<User, "id"> = { name: "", role: "default", current: false };

  onAddUser() {
    if (!this.newUser.name.trim()) return;
    this.addUser.emit({ ...this.newUser });
    this.newUser = { name: "", role: "default", current: false };
  }

  onEditUser(user: User, field: keyof Omit<User, "id">, value: any) {
    this.editUser.emit({ ...user, [field]: value });
  }

  onSetCurrentUser(userId: string) {
    this.setCurrentUser.emit(userId);
  }
}
