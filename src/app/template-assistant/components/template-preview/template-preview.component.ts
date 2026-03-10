/**
 * Template Preview Component.
 * Displays live preview of template with customer data merged.
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
  signal,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { marked } from "marked";
import { TemplatePreviewService } from "../../services/template-preview.service";
import { CustomerDataService } from "../../services/customer-data.service";
import { CustomerRecord, DataField } from "../../models";

const VIEWPORT_STORAGE_KEY = "wdx-preview-viewport";

@Component({
  selector: "app-template-preview",
  standalone: true,
  imports: [CommonModule, NgbNavModule],
  templateUrl: "./template-preview.component.html",
  styleUrls: ["./template-preview.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewComponent implements OnInit {
  // Inputs
  @Input() set markdown(value: string) {
    this._markdown.set(value);
  }

  @Input() set customerData(value: CustomerRecord | null) {
    this._customerData.set(value);
  }

  @Input() set fields(value: DataField[]) {
    this._fields.set(value);
  }

  // Internal signals
  protected _markdown = signal<string>("");
  private _customerData = signal<CustomerRecord | null>(null);
  private _fields = signal<DataField[]>([]);

  // Customer navigation
  private _allCustomers = signal<CustomerRecord[]>([]);
  protected currentCustomerIndex = signal<number>(0);

  // Computed current customer
  protected currentCustomer = computed(() => {
    const customers = this._allCustomers();
    const index = this.currentCustomerIndex();
    return customers.length > 0 ? customers[index] : null;
  });

  // Navigation state
  protected canGoPrevious = computed(() => this.currentCustomerIndex() > 0);
  protected canGoNext = computed(() => {
    const customers = this._allCustomers();
    return this.currentCustomerIndex() < customers.length - 1;
  });
  protected customerCount = computed(() => this._allCustomers().length);

  // Tab state - default to HTML view
  activeTab: "html" | "markdown" = "html";

  // Theme selection
  protected selectedTheme = signal<string>("default");
  protected availableThemes = [
    { value: "default", label: "Default" },
    { value: "professional", label: "Professional" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
  ];

  // Viewport selection
  protected selectedViewport = signal<string>("desktop");
  protected availableViewports = [
    { value: "desktop", label: "Desktop" },
    { value: "mobile", label: "Mobile" },
  ];

  // Computed preview HTML
  protected renderedHtml = computed(() => {
    return this.interpolateAndRender(
      this._markdown(),
      this._customerData(),
      this._fields(),
    );
  });

  constructor(
    private previewService: TemplatePreviewService,
    private customerDataService: CustomerDataService,
    private sanitizer: DomSanitizer,
  ) {
    // Configure marked for GitHub Flavored Markdown
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  async ngOnInit(): Promise<void> {
    // Load viewport preference from localStorage
    this.loadViewportPreference();

    // Load all customer data from JSON
    const customers = await this.customerDataService.loadCustomers();
    if (customers && customers.length > 0) {
      this._allCustomers.set(customers);
      this.currentCustomerIndex.set(0);
    }
  }

  /**
   * Navigate to next customer
   */
  nextCustomer(): void {
    if (this.canGoNext()) {
      this.currentCustomerIndex.update((i) => i + 1);
    }
  }

  /**
   * Navigate to previous customer
   */
  previousCustomer(): void {
    if (this.canGoPrevious()) {
      this.currentCustomerIndex.update((i) => i - 1);
    }
  }
  /**
   * Change preview theme
   */
  changeTheme(theme: string): void {
    this.selectedTheme.set(theme);
  }

  /**
   * Change preview viewport
   */
  changeViewport(viewport: string): void {
    this.selectedViewport.set(viewport);
    this.saveViewportPreference();
  }

  /**
   * Load viewport preference from localStorage.
   */
  private loadViewportPreference(): void {
    try {
      const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
      if (stored && (stored === "desktop" || stored === "mobile")) {
        this.selectedViewport.set(stored);
      }
    } catch (error) {
      console.error("Failed to load viewport preference:", error);
    }
  }

  /**
   * Save viewport preference to localStorage.
   */
  private saveViewportPreference(): void {
    try {
      localStorage.setItem(VIEWPORT_STORAGE_KEY, this.selectedViewport());
    } catch (error) {
      console.error("Failed to save viewport preference:", error);
    }
  }
  /**
   * Interpolate template markdown with customer data and convert to HTML.
   */
  private interpolateAndRender(
    markdown: string,
    customerData: CustomerRecord | null,
    fields: DataField[],
  ): SafeHtml {
    if (!markdown) {
      return this.sanitizer.sanitize(1, "") || "";
    }

    // Use provided customer data, or fallback to current customer from JSON
    const data = customerData || this.currentCustomer() || {};

    // Interpolate template with data
    const interpolated = this.previewService.interpolate(
      markdown,
      data,
      fields,
    );

    // Convert markdown line breaks to HTML
    const html = this.markdownToHtml(interpolated);

    // Sanitize and return
    return this.sanitizer.sanitize(1, html) || "";
  }

  /**
   * Convert markdown to HTML using marked library.
   */
  private markdownToHtml(markdown: string): string {
    try {
      return marked.parse(markdown) as string;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return markdown;
    }
  }
}
