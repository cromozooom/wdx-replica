import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-config-inheritance-modal",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Configuration Inheritance</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="activeModal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <p class="mb-3">
        You are dropping an item into
        <strong>"{{ parentLabel }}"</strong> which has an existing
        configuration.
      </p>
      <p class="mb-3">
        Since it will become a parent, the configuration won't be accessible
        anymore. Would you like to create a new child to inherit this
        configuration?
      </p>

      <div class="mb-3">
        <label for="childName" class="form-label">
          Child Name (will inherit configuration):
        </label>
        <input
          type="text"
          class="form-control"
          id="childName"
          [(ngModel)]="childName"
          (keydown.enter)="confirm()"
          placeholder="Enter name for the configuration child"
          autofocus
        />
      </div>
    </div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="activeModal.dismiss()"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        (click)="confirm()"
        [disabled]="!childName || !childName.trim()"
      >
        Create Child
      </button>
    </div>
  `,
  styles: [
    `
      .modal-body p {
        line-height: 1.6;
      }
    `,
  ],
})
export class ConfigInheritanceModalComponent {
  activeModal = inject(NgbActiveModal);

  @Input() parentLabel = "";
  @Input() defaultChildName = "";

  childName = "";

  ngOnInit() {
    this.childName = this.defaultChildName;
  }

  confirm() {
    if (this.childName && this.childName.trim()) {
      this.activeModal.close(this.childName.trim());
    }
  }
}
