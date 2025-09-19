import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-job-editor",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="job-editor p-3 border rounded bg-light">
      <h5>Job Editor</h5>
      <div *ngIf="id; else noId">
        <span
          >Editing job with ID: <b>{{ id }}</b></span
        >
      </div>
      <ng-template #noId>
        <span>No job selected. Please select a job to edit.</span>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .job-editor {
        min-height: 100px;
      }
    `,
  ],
})
export class JobEditorComponent {
  @Input() id: string | null = null;
}
