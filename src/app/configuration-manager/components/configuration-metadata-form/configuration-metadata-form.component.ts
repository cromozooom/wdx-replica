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
  @Output() formChange = new EventEmitter<Partial<Configuration>>();
  @Output() updateEntryChange = new EventEmitter<UpdateEntry | null>();

  private fb = inject(FormBuilder);
  private teamMemberService = inject(TeamMemberService);

  form!: FormGroup;
  updateEntryForm!: FormGroup;
  configurationTypes = Object.values(ConfigurationType);
  teamMembers: string[] = [];

  ngOnInit(): void {
    this.teamMembers = this.teamMemberService.getTeamMembers();
    this.initForm();
    if (this.showUpdateEntry) {
      this.initUpdateEntryForm();
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

  private initUpdateEntryForm(): void {
    const currentUser = this.teamMemberService.getCurrentUser();
    this.updateEntryForm = this.fb.group(
      {
        jiraTicket: ['', [Validators.pattern(/^WPO-\d{5}$/)]],
        comment: [''],
        madeBy: [currentUser, Validators.required],
      },
      { validators: this.atLeastOneValidator }
    );

    this.updateEntryForm.valueChanges.subscribe((value) => {
      if (this.updateEntryForm.valid) {
        const updateEntry: UpdateEntry = {
          ...value,
          jiraTicket: value.jiraTicket || undefined,
          comment: value.comment || undefined,
          date: new Date(),
        };
        this.updateEntryChange.emit(updateEntry);
      } else {
        this.updateEntryChange.emit(null);
      }
    });
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

  get jiraTicketControl() {
    return this.updateEntryForm?.get('jiraTicket');
  }

  get commentControl() {
    return this.updateEntryForm?.get('comment');
  }

  get madeByControl() {
    return this.updateEntryForm?.get('madeBy');
  }
}
