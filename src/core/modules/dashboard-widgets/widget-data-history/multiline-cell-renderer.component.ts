import { Component, Input } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-multiline-cell-renderer",
  standalone: true,
  template: `
    <div class="d-flex h-100 position-relative blockHover">
      <div class="position-absolute top-0 end-0">
        <button
          class="text-decoration-none btn btn-link btn-sm elem d-flex gap-1 align-items-center mt-2"
          (click)="copyToClipboard()"
        >
          <i class="fas fa-clipboard"></i> <span>copy</span>
        </button>
      </div>
      <span [innerHTML]="value"></span>
    </div>
  `,
  styles: [
    `
      button {
        background: rgba(255, 255, 255, 0.8);
      }
      button:hover {
        background: rgba(255, 255, 255, 0.8);
      }
    `,
  ],
})
export class MultilineCellRenderer implements ICellRendererAngularComp {
  @Input() value: string = "";
  agInit(params: any) {
    this.value = (params.value || "").replace(/\n/g, "<br>");
    this.rawValue = params.value || "";
  }

  rawValue: string = "";

  copyToClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.rawValue);
    } else {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = this.rawValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }
  refresh() {
    return false;
  }
}
