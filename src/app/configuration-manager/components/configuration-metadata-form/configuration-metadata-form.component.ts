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
import { TeamMemberService } from '../../services/team-member.service';

@Component({
  selector: 'app-configuration-metadata-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuration-metadata-form.component.html',
  styleUrls: ['./configuration-metadata-form.component.scss'],
})
export class ConfigurationMetadataFormComponent implements OnInit {
  @Input() configuration?: Configuration;
  @Output() formChange = new EventEmitter<Partial<Configuration>>();

  private fb = inject(FormBuilder);
  private teamMemberService = inject(TeamMemberService);

  form!: FormGroup;
  configurationTypes = Object.values(ConfigurationType);
  teamMembers: string[] = [];

  ngOnInit(): void {
    this.teamMembers = this.teamMemberService.getTeamMembers();
    this.initForm();
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

  get nameControl() {
    return this.form.get('name');
  }

  get typeControl() {
    return this.form.get('type');
  }

  get versionControl() {
    return this.form.get('version');
  }
}
