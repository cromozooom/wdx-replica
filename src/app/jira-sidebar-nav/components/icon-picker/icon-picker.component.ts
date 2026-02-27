import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { IconDefinition } from "../../models/icon-definition.interface";
import { FONT_AWESOME_ICONS } from "../../utils/font-awesome-icons.const";

/**
 * Reusable component for selecting FontAwesome icons.
 * Wraps ng-select with custom templates showing icon previews.
 *
 * Features:
 * - Search/filter icons by name or category
 * - Visual preview of icons in dropdown
 * - Category grouping
 * - Validation for icon format
 *
 * @component IconPickerComponent
 * @standalone
 */
@Component({
  selector: "app-icon-picker",
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: "./icon-picker.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent implements OnInit {
  /**
   * Currently selected icon CSS class (e.g., "fas fa-home").
   */
  @Input() selectedIcon?: string;

  /**
   * Emits when icon selection changes.
   */
  @Output() iconChange = new EventEmitter<string>();

  /**
   * All available icons from constants.
   */
  readonly icons: IconDefinition[] = FONT_AWESOME_ICONS;

  /**
   * Selected icon object (for ng-select binding).
   */
  selectedIconObject?: IconDefinition;

  ngOnInit(): void {
    // Find icon object matching selected CSS class
    if (this.selectedIcon) {
      this.selectedIconObject = this.icons.find(
        (icon) => icon.cssClass === this.selectedIcon,
      );
    }
  }

  /**
   * Handle icon selection change from ng-select.
   */
  onIconSelect(icon: IconDefinition | null): void {
    if (icon) {
      this.selectedIcon = icon.cssClass;
      this.iconChange.emit(icon.cssClass);
    } else {
      this.selectedIcon = undefined;
      this.iconChange.emit("");
    }
  }

  /**
   * Custom search function for ng-select.
   * Searches in label, category, and CSS class.
   */
  customSearchFn(term: string, item: IconDefinition): boolean {
    term = term.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.cssClass.toLowerCase().includes(term)
    );
  }

  /**
   * Validate icon format (FR-034).
   * Expected format: fa[srlab] fa-[icon-name]
   */
  static validateIconFormat(iconClass: string): boolean {
    const pattern = /^fa[srlab] fa-[a-z0-9-]+$/;
    return pattern.test(iconClass);
  }
}
