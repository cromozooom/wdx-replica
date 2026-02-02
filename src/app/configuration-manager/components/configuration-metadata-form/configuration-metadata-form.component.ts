import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfigurationType } from '../../models/configuration-type.enum';
import { Configuration } from '../../models/configuration.model';
import { UpdateEntry } from '../../models/update-entry.model';
import { TeamMemberService } from '../../services/team-member.service';
import { UpdateHistoryComponent } from '../update-history/update-history.component';

@Component({
  selector: 'app-configuration-metadata-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UpdateHistoryComponent],
  templateUrl: './configuration-metadata-form.component.html',
  styleUrls: ['./configuration-metadata-form.component.scss'],
})
export class ConfigurationMetadataFormComponent implements OnInit {
  @Input() configuration?: Configuration;
  @Input() showUpdateEntry = false;
  @Input() showGeneralOnly = false;
  @Output() formChange = new EventEmitter<Partial<Configuration>>();
  @Output() updateEntriesChange = new EventEmitter<UpdateEntry[]>();

  private fb = inject(FormBuilder);
  private teamMemberService = inject(TeamMemberService);

  form!: FormGroup;
  updateEntriesFormArray!: FormArray;
  configurationTypes = Object.values(ConfigurationType);
  teamMembers: string[] = [];

  ngOnInit(): void {
    this.teamMembers = this.teamMemberService.getTeamMembers();
    this.initForm();
    if (this.showUpdateEntry) {
      this.initUpdateEntriesFormArray();
      this.addUpdateEntry(); // Start with one entry
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [this.configuration?.name || '', Validators.required],
      type: [
        this.configuration?.type || ConfigurationType.DashboardConfig,
        Validators.required,
      ],
      version: [
        this.configuration?.version || 'V1.0.0',
        [Validators.required, Validators.pattern(/^V\d+\.\d+\.\d+$/)],
      ],
    });

    this.form.valueChanges.subscribe((value) => {
      if (this.form.valid) {
        this.formChange.emit(value);
      }
    });
  }

  private initUpdateEntriesFormArray(): void {
    this.updateEntriesFormArray = this.fb.array([]);

    this.updateEntriesFormArray.valueChanges.subscribe(() => {
      this.emitUpdateEntries();
    });
  }

  private createUpdateEntryFormGroup(): FormGroup {
    const currentUser = this.teamMemberService.getCurrentUser();
    return this.fb.group(
      {
        jiraTicket: ['', [Validators.pattern(/^WPO-\d{5}$/)]],
        comment: [''],
        madeBy: [currentUser, Validators.required],
      },
      { validators: this.atLeastOneValidator }
    );
  }

  addUpdateEntry(): void {
    this.updateEntriesFormArray.push(this.createUpdateEntryFormGroup());
  }

  removeUpdateEntry(index: number): void {
    this.updateEntriesFormArray.removeAt(index);
  }

  private emitUpdateEntries(): void {
    const validEntries: UpdateEntry[] = [];
    
    for (let i = 0; i < this.updateEntriesFormArray.length; i++) {
      const group = this.updateEntriesFormArray.at(i) as FormGroup;
      if (group.valid) {
        const value = group.value;
        validEntries.push({
          ...value,
          jiraTicket: value.jiraTicket || undefined,
          comment: value.comment || undefined,
          date: new Date(),
        });
      }
    }

    this.updateEntriesChange.emit(validEntries);
  }

  get updateEntries(): FormGroup[] {
    return this.updateEntriesFormArray.controls as FormGroup[];
  }

  private atLeastOneValidator(group: FormGroup): { [key: string]: any } | null {
    const jira = group.get('jiraTicket')?.value;
    const comment = group.get('comment')?.value;

    if (!jira && !comment) {
      return { atLeastOne: 'Either Jira ticket or comment is required' };
    }
    return null;
  }

  get nameControl() {
    return this.form.get('name');
  }

  get typeControl() {
    return this.form.get('type');
  }

  get versionControl() {
    return this.form.get('version');
  }

  getJiraTicketControl(index: number) {
    return this.updateEntriesFormArray?.at(index)?.get('jiraTicket');
  }

  getCommentControl(index: number) {
    return this.updateEntriesFormArray?.at(index)?.get('comment');
  }

  getMadeByControl(index: number) {
    return this.updateEntriesFormArray?.at(index)?.get('madeBy');
  }

  get hasValidEntries(): boolean {
    return this.updateEntriesFormArray?.controls.some(control => control.valid) ?? false;
  }
}
