/**
 * Template Preview Component.
 * Displays live preview of template with customer data merged.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
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
// @ts-ignore - juice doesn't have TypeScript definitions
import * as juice from "juice";

const VIEWPORT_STORAGE_KEY = "wdx-preview-viewport";
const TAB_STORAGE_KEY = "wdx-preview-active-tab";

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

  // Outputs
  @Output() tabChanged = new EventEmitter<string>();

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
  activeTab: "html" | "markdown" | "htmlWithVariables" = "html";

  // Theme selection
  protected selectedTheme = signal<string>("default");
  protected availableThemes = [
    { value: "default", label: "Default" },
    { value: "professional", label: "Professional" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
  ];

  // Viewport selection
  protected selectedViewport = signal<string>(this.getInitialViewport());
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

  // Computed HTML with template variables and inline CSS
  protected htmlWithVariablesAndInlineCSS = computed(() => {
    return this.generateHtmlWithInlineStyles(this._markdown());
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

    // Load tab preference from localStorage (in constructor for immediate availability)
    this.loadTabPreference();
  }

  async ngOnInit(): Promise<void> {
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
   * Change active tab
   */
  changeTab(tab: "html" | "markdown" | "htmlWithVariables"): void {
    this.activeTab = tab;
    this.saveTabPreference();
    this.tabChanged.emit(tab);
  }

  /**
   * Get initial viewport from localStorage or default.
   */
  private getInitialViewport(): string {
    try {
      const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
      if (stored && (stored === "desktop" || stored === "mobile")) {
        return stored;
      }
    } catch (error) {
      console.error("Failed to load viewport preference:", error);
    }
    return "desktop";
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
   * Load tab preference from localStorage.
   */
  private loadTabPreference(): void {
    try {
      const stored = localStorage.getItem(TAB_STORAGE_KEY);
      if (
        stored &&
        (stored === "html" ||
          stored === "markdown" ||
          stored === "htmlWithVariables")
      ) {
        this.activeTab = stored;
      }
    } catch (error) {
      console.error("Failed to load tab preference:", error);
    }
  }

  /**
   * Save tab preference to localStorage.
   */
  private saveTabPreference(): void {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, this.activeTab);
    } catch (error) {
      console.error("Failed to save tab preference:", error);
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
      return this.sanitizer.bypassSecurityTrustHtml("");
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

    // For email templates, we need to allow inline styles (they're essential for email clients)
    // This is safe because the content is user-generated template content, not external input
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Convert markdown to HTML using marked library.
   * Preprocesses alignment shortcodes before markdown conversion.
   */
  private markdownToHtml(markdown: string): string {
    try {
      // Log the incoming markdown to check if shortcodes are present
      if (markdown.includes("[align:")) {
        console.log(
          "🎨 Markdown contains alignment shortcodes:",
          markdown.substring(0, 200),
        );
      }

      // First, convert the shortcodes to HTML divs with inline styles
      const withMarkers = markdown
        .replace(
          /\[align:(left|center|right|justify)\]/gi,
          (match, alignment) => {
            console.log(`🎨 Replacing [align:${alignment}] with styled div`);
            return `<div data-align="${alignment}" style="text-align: ${alignment};">`;
          },
        )
        .replace(/\[\/align\]/gi, () => {
          console.log("🎨 Replacing [/align] with </div>");
          return "</div>";
        });

      console.log(
        "🎨 After shortcode replacement:",
        withMarkers.substring(0, 300),
      );

      // Now parse the markdown with the div markers in place
      const html = marked.parse(withMarkers) as string;

      console.log("🎨 Processed HTML preview:", html.substring(0, 300));

      return html;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return markdown;
    }
  }

  /**
   * Convert [align:X]...[/align] shortcodes to HTML divs with text-align styles.
   * This parses the markdown content inside the shortcodes, then wraps in aligned divs.
   */
  private preprocessAlignmentShortcodes(markdown: string): string {
    // Match [align:X]content[/align] pattern (non-greedy, multiline)
    const alignmentRegex =
      /\[align:(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi;

    // Check if there are any alignment shortcodes
    const hasAlignments = alignmentRegex.test(markdown);
    if (hasAlignments) {
      console.log("🎨 Found alignment shortcodes in markdown");
    }

    // Reset regex after test
    alignmentRegex.lastIndex = 0;

    return markdown.replace(alignmentRegex, (match, alignment, content) => {
      console.log(`🎨 Processing alignment: ${alignment}`);

      // Parse the markdown content inside the shortcode first
      const contentMarkdown = content.trim();
      const contentHtml = marked.parse(contentMarkdown) as string;

      // Wrap the parsed HTML in a div with text-align style
      // Use inline styles for maximum email client compatibility
      return `<div style="text-align: ${alignment}; margin: 0.5em 0;">${contentHtml}</div>`;
    });
  }

  /**
   * Generate HTML with template variables (not interpolated) and inline CSS.
   */
  private generateHtmlWithInlineStyles(markdown: string): string {
    if (!markdown) {
      return "";
    }

    // Convert markdown to HTML without interpolation (keep {{ variables }})
    const html = this.markdownToHtml(markdown);

    // Get the CSS for the selected theme
    const themeCSS = this.getThemeCSS();

    // Inline the CSS using juice
    let htmlWithInlineStyles: string;
    try {
      htmlWithInlineStyles = juice.inlineContent(html, themeCSS, {
        applyStyleTags: true,
        removeStyleTags: false,
        preserveMediaQueries: true,
        preserveFontFaces: true,
      });
    } catch (error) {
      console.error("Error inlining CSS:", error);
      htmlWithInlineStyles = html;
    }

    // Wrap in email-compatible HTML structure
    return this.wrapInEmailTemplate(htmlWithInlineStyles);
  }

  /**
   * Wrap content in email-compatible HTML structure with MSO support.
   */
  private wrapInEmailTemplate(content: string): string {
    return `<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
</head>
<body style="word-spacing:normal;background-color:#F4F4F4;">
${content}
</body>
</html>`;
  }

  /**
   * Extract CSS rules for the selected theme.
   */
  private getThemeCSS(): string {
    const theme = this.selectedTheme();
    const baseCSS = this.getBaseCSS();
    const themeSpecificCSS = this.getThemeSpecificCSS(theme);

    return baseCSS + "\n" + themeSpecificCSS;
  }

  /**
   * Get base CSS that applies to all themes.
   */
  private getBaseCSS(): string {
    return `
      body, .preview-content {
        font-size: 14px;
        color: #212529;
      }
      p {
        margin: 0 0 1em 0;
      }
      p:last-child {
        margin-bottom: 0;
      }
      br {
        display: block;
        margin: 0.5em 0;
        content: "";
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1.1em; }
      h5 { font-size: 1em; }
      h6 { font-size: 0.9em; }
      ul, ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }
      li {
        margin: 0.25em 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #dee2e6;
        padding: 0.5rem;
        text-align: left;
      }
      th {
        background-color: #f8f9fa;
        font-weight: 600;
      }
      pre {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 0.75rem;
        overflow-x: auto;
        margin: 0.5em 0;
      }
      code {
        font-family: "Consolas", "Monaco", "Courier New", monospace;
        font-size: 0.9em;
      }
      blockquote {
        border-left: 4px solid #dee2e6;
        padding-left: 1rem;
        margin: 0.5em 0;
        color: #6c757d;
        font-style: italic;
      }
      hr {
        border: none;
        border-top: 1px solid #dee2e6;
        margin: 1em 0;
      }
      .field-not-available {
        color: #dc3545;
        font-style: italic;
        background-color: #fff3cd;
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid #ffc107;
        font-size: 0.9em;
      }
      /* Alignment container styles for preview */
      div[style*="text-align"] {
        display: block;
        padding: 0.25em 0;
      }
      div[style*="text-align: left"] {
        text-align: left !important;
      }
      div[style*="text-align: center"] {
        text-align: center !important;
      }
      div[style*="text-align: right"] {
        text-align: right !important;
      }
      div[style*="text-align: justify"] {
        text-align: justify !important;
      }
    `;
  }

  /**
   * Get theme-specific CSS.
   */
  private getThemeSpecificCSS(theme: string): string {
    switch (theme) {
      case "professional":
        return `
          body, .preview-content {
            font-family: Georgia, "Times New Roman", serif;
            color: #1a1a1a;
            line-height: 1.7;
          }
          h1 {
            font-size: 1.5rem;
            color: #0d47a1;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 0.25rem;
            margin: 1rem 0 0.75rem 0;
          }
          h2 {
            font-size: 1.25rem;
            color: #1565c0;
            margin: 0.875rem 0 0.625rem 0;
          }
          h3 {
            font-size: 1.1rem;
            color: #1976d2;
            margin: 0.75rem 0 0.5rem 0;
          }
          th {
            background-color: #0d47a1;
            color: white;
          }
          blockquote {
            border-left-color: #0d47a1;
            color: #424242;
            background-color: #f5f5f5;
            padding: 0.75rem 1rem;
          }
          code {
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            color: #c7254e;
          }
        `;
      case "modern":
        return `
          body, .preview-content {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #2d3748;
            line-height: 1.75;
          }
          h1 {
            font-size: 1.75rem;
            color: #6366f1;
            font-weight: 700;
            margin: 1.25rem 0 0.75rem 0;
            letter-spacing: -0.025em;
          }
          h2 {
            font-size: 1.4rem;
            color: #8b5cf6;
            font-weight: 600;
            margin: 1rem 0 0.625rem 0;
          }
          h3 {
            font-size: 1.15rem;
            color: #a855f7;
            font-weight: 600;
            margin: 0.875rem 0 0.5rem 0;
          }
          p {
            margin: 0 0 1.25em 0;
          }
          table {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          th {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            font-weight: 600;
          }
          td {
            border-color: #e2e8f0;
          }
          blockquote {
            border-left: 4px solid #6366f1;
            background-color: #f0f4ff;
            padding: 1rem 1.25rem;
            border-radius: 0 8px 8px 0;
            color: #4338ca;
          }
          code {
            background-color: #f1f5f9;
            color: #6366f1;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-weight: 500;
          }
          pre {
            background-color: #1e293b;
            color: #e2e8f0;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        `;
      case "minimal":
        return `
          body, .preview-content {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.8;
            font-size: 15px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #000;
            font-weight: 300;
            letter-spacing: 0.02em;
          }
          h1 {
            font-size: 1.75rem;
            margin: 2rem 0 1rem 0;
          }
          h2 {
            font-size: 1.4rem;
            margin: 1.5rem 0 0.875rem 0;
          }
          h3 {
            font-size: 1.15rem;
            margin: 1.25rem 0 0.75rem 0;
          }
          p {
            margin: 0 0 1.5em 0;
          }
          table {
            border: none;
          }
          th, td {
            border: none;
            border-bottom: 1px solid #e5e5e5;
            padding: 0.75rem 0.5rem;
          }
          th {
            background-color: transparent;
            font-weight: 400;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: #666;
          }
          blockquote {
            border-left: 2px solid #ccc;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: #666;
            font-style: normal;
            background-color: transparent;
          }
          code {
            background-color: #f9f9f9;
            color: #555;
            padding: 0.15em 0.3em;
            font-size: 0.9em;
          }
          pre {
            background-color: #fafafa;
            border: 1px solid #eee;
            padding: 1rem;
          }
        `;
      default: // default theme
        return "";
    }
  }
}
