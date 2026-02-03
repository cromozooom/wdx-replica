import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as jsondiffpatch from "jsondiffpatch";

@Component({
  selector: "app-json-diff-viewer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="json-diff-container">
      <div #diffContainer class="diff-viewer"></div>
    </div>
  `,
  styles: [
    `
      .json-diff-container {
        border: 1px solid #dee2e6;
        border-radius: 4px;
        overflow: auto;
        max-height: 500px;
        background: white;
      }

      .diff-viewer {
        padding: 1rem;
        font-family: "Courier New", Courier, monospace;
        font-size: 0.875rem;
      }

      :host ::ng-deep .jsondiffpatch-delta {
        font-family: "Courier New", Courier, monospace;
        font-size: 0.875rem;
      }

      :host ::ng-deep .jsondiffpatch-added .jsondiffpatch-property-name,
      :host ::ng-deep .jsondiffpatch-added .jsondiffpatch-value pre {
        background-color: #d4edda !important;
      }

      :host ::ng-deep .jsondiffpatch-deleted .jsondiffpatch-property-name,
      :host ::ng-deep .jsondiffpatch-deleted .jsondiffpatch-value pre {
        background-color: #f8d7da !important;
      }

      :host ::ng-deep .jsondiffpatch-modified .jsondiffpatch-value pre {
        background-color: #fff3cd !important;
      }

      :host ::ng-deep .jsondiffpatch-unchanged {
        opacity: 0.6;
      }
    `,
  ],
})
export class JsonDiffViewerComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() leftValue: string = "{}";
  @Input() rightValue: string = "{}";

  @ViewChild("diffContainer", { static: false })
  diffContainer!: ElementRef;

  private differ = jsondiffpatch.create({
    objectHash: function (obj: any) {
      return obj.id || obj.name || JSON.stringify(obj);
    },
    arrays: {
      detectMove: true,
      includeValueOnMove: false,
    },
    textDiff: {
      minLength: 60,
    },
  });

  ngAfterViewInit(): void {
    this.renderDiff();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes["leftValue"] || changes["rightValue"]) && this.diffContainer) {
      this.renderDiff();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private renderDiff(): void {
    if (!this.diffContainer) return;

    try {
      const leftJson = JSON.parse(this.leftValue);
      const rightJson = JSON.parse(this.rightValue);

      const delta = this.differ.diff(leftJson, rightJson);

      if (delta) {
        const html = jsondiffpatch.formatters.html.format(delta, leftJson);
        this.diffContainer.nativeElement.innerHTML = html;
      } else {
        this.diffContainer.nativeElement.innerHTML =
          '<div class="alert alert-info">No differences found</div>';
      }
    } catch (error) {
      console.error("Error parsing JSON for diff:", error);
      this.diffContainer.nativeElement.innerHTML = `
        <div class="alert alert-danger">
          <strong>Error:</strong> Invalid JSON format
        </div>
      `;
    }
  }
}
