import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { UpdateEntry } from '../../models/update-entry.model';

@Component({
  selector: 'app-update-history',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  templateUrl: './update-history.component.html',
  styleUrls: ['./update-history.component.scss'],
})
export class UpdateHistoryComponent {
  @Input() updates: UpdateEntry[] = [];

  get sortedUpdates(): UpdateEntry[] {
    return [...this.updates].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
