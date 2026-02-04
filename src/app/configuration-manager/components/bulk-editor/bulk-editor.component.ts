import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Configuration } from "../../models/configuration.model";
import { UpdateEntry } from "../../models/update-entry.model";
import { TeamMemberService } from "../../services/team-member.service";

@Component({
  selector: "app-bulk-editor",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./bulk-editor.component.html",
  styleUrls: ["./bulk-editor.component.scss"],
})
export class BulkEditorComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private teamMemberService = inject(TeamMemberService);

  configurations: Configuration[] = [];
  form!: FormGroup;
  saving = false;
  teamMembers: string[] = [];

  ngOnInit(): void {
    this.teamMembers = this.teamMemberService.getTeamMembers();
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      version: [
        "",
        [Validators.required, Validators.pattern(/^V\d+\.\d+\.\d+$/)],
      ],
      updateEntries: this.fb.array([this.createUpdateEntryFormGroup()]),
    });
  }

  private createUpdateEntryFormGroup(): FormGroup {
    return this.fb.group({
      jiraTicket: [""],
      comment: [""],
      date: [new Date()],
      madeBy: [this.teamMemberService.getCurrentUser()],
    });
  }

  get updateEntriesFormArray(): FormArray {
    return this.form.get("updateEntries") as FormArray;
  }

  get updateEntries(): FormGroup[] {
    return this.updateEntriesFormArray.controls as FormGroup[];
  }

  addUpdateEntry(): void {
    this.updateEntriesFormArray.push(this.createUpdateEntryFormGroup());
  }

  removeUpdateEntry(index: number): void {
    if (this.updateEntriesFormArray.length > 1) {
      this.updateEntriesFormArray.removeAt(index);
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const newVersion = formValue.version;
    const newUpdateEntries: UpdateEntry[] = formValue.updateEntries
      .filter((entry: any) => entry.jiraTicket || entry.comment)
      .map((entry: any) => ({
        jiraTicket: entry.jiraTicket || undefined,
        comment: entry.comment || undefined,
        date: entry.date || new Date(),
        madeBy: entry.madeBy || "Unknown",
        previousValue: undefined, // Will be set by the service
      }));

    this.activeModal.close({
      version: newVersion,
      updateEntries: newUpdateEntries,
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get versionControl() {
    return this.form.get("version");
  }
}
