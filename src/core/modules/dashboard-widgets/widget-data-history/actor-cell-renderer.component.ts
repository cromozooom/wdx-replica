import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-actor-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-2 py-2">
      <div
        class="rounded rounded-circle p-2 "
        [ngStyle]="{
          'background-color': 'var(--' + colorIndex + ') !important',
          color: 'var(--ink-' + colorIndex + ') !important',
        }"
      >
        {{ initials }}
      </div>
      <span>{{ name }}</span>
    </div>
  `,
  styles: [
    `
      .rounded-circle {
        width: 2.2rem;
        height: 2.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class ActorCellRendererComponent implements ICellRendererAngularComp {
  public initials: string = "";
  public name: string = "";
  public bgColor: string = "";
  public inkColor: string = "";
  public colorIndex: number = 0;

  agInit(params: any): void {
    const actor = params.data?.actor;
    this.name = actor?.displayName || "-";
    this.initials = this.getInitials(this.name);
    // Hash the name to a number between 1 and 68
    const hash = this.hashString(this.name);
    this.colorIndex = 1 + (hash % 68);
    this.bgColor =
      getComputedStyle(document.body)
        .getPropertyValue(`var(--${this.colorIndex})`)
        .replace(/"/g, "")
        .trim() || "#eee";
    this.inkColor =
      getComputedStyle(document.body)
        .getPropertyValue(`var(--ink-${this.colorIndex})`)
        .replace(/"/g, "")
        .trim() || "#222";
    // console.log("ActorCellRendererComponent", {
    //   colorIndex: this.colorIndex,
    //   bgColor: this.bgColor,
    //   inkColor: this.inkColor,
    // });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  refresh(): boolean {
    return false;
  }

  private getInitials(name: string): string {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
