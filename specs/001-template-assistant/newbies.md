# Template Assistant - Technical Overview for Beginners

## What We Built

An email template editor for bank analysts that lets them create reusable
document templates with customer data placeholders (like mail merge in Word, but
for emails). The editor uses markdown as the source of truth and extends it with
two custom features:

1. **Data Field Pills**: `{{Customer_Name}}` - placeholders that get replaced
   with real customer data
2. **Text Alignment**: `[align:center]...[/align]` - sections with custom
   alignment (left/center/right/justify)

**Important**: This is designed for simple, professional email templates
(welcome letters, notifications, basic reports) - NOT for converting complex
Word documents or creating marketing campaigns with fancy layouts. Email clients
have severe limitations; we work within them using a shortcode-based approach
that ensures compatibility across all devices (especially mobile).

## The Core Principle: Markdown is King 👑

**CRITICAL CONCEPT**: Everything starts from a markdown file with shortcodes and
variables. This file is saved to localStorage and is the single source of truth.

**📱 Mobile-First**: All features must work on mobile devices (50%+ of emails
are read on phones). This drives our design decisions.

**🔧 Shortcode Philosophy**: Every feature beyond standard markdown (headings,
lists, bold, italic) is implemented as a shortcode. This keeps the system
simple, predictable, and extensible:

- Text alignment: `[align:center]...[/align]`
- Variables: `{{Field_Name}}`
- Future features: `[button:url]`, `[image:id]`, `[signature]`, etc.

**⚠️ NOT a Word Replacement ⚠️ **: This is NOT a tool for converting complex
Word documents into email. Email clients have severe limitations:

- ⚠️ No floating elements
- ⚠️ No absolute positioning
- ⚠️ No complex layouts
- ⚠️ No background images (unreliable)
- ⚠️ No external stylesheets

Keep templates simple: headings, paragraphs, alignment, lists, tables. If it
needs complex layout or graphics, use a professional email design tool instead.

```markdown
[align:center]

# Customer Welcome Letter

[/align]

Dear {{Full_Name}},

Your account {{Account_Number}} has been activated on {{Activation_Date}}.

[align:right] Sincerely, Bank Manager [/align]
```

This markdown file gets transformed into:

- **Rich editor view**: Pills show as colored badges, alignment blocks have
  colored borders
- **HTML preview**: Variables filled with customer data, alignment converted to
  inline CSS
- **Saved template**: Original markdown preserved perfectly for reloading later

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  MARKDOWN FILE (localStorage)                               │
│  - Variables: {{Field_Name}}                                │
│  - Alignment: [align:X]...[/align]                          │
│  - Regular markdown: headings, lists, bold, etc.            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Source of Truth ★
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌────────────────┐   ┌────────────────────────────────────────┐
│   EDITOR       │   │   PREVIEW & EMAIL EXPORT               │
│   (Milkdown)   │   │                                        │
├────────────────┤   │  1. Interpolate: {{Name}} → "John"     │
│ Pills: badges  │   │  2. Convert: [align:X] → <div style..> │
│ Align: borders │   │  3. Parse: Markdown → HTML             │
│ Live editing   │   │  4. Theme: Apply CSS (Professional)    │
│                │   │  5. Juice: Inline all styles           │
│                │   │  6. Wrap: Email boilerplate + MSO      │
│                │   │                                        │
│                │   │  Result: Email-ready HTML ✉️           │
└────────────────┘   └────────────────────────────────────────┘
```

## How It Works

### 1. Saving Templates (Markdown Out)

When you click Save:

- Editor converts ProseMirror document → Markdown with shortcodes
- Pills become `{{Field_Name}}` syntax
- Alignment blocks become `[align:X]...[/align]` syntax
- Pure markdown string saved to localStorage

**Why this matters**: You can copy the markdown to any text editor, email it,
version control it - it's just text!

### 2. Loading Templates (Markdown In)

When you open a saved template:

- Markdown string loaded from localStorage
- Custom parser finds `{{variables}}` and creates pill nodes
- Custom parser finds `[align:X]` blocks and creates alignment containers
- Milkdown renders rich editor with visual styling

### 3. Live Preview & Email Export

**Preview (instant feedback)**:

- Take original markdown from editor
- Replace `{{variables}}` with actual customer data values
- Convert `[align:X]` to `<div style="text-align: X;">`
- Parse resulting markdown → HTML
- Display in preview pane

**Email Export (production-ready HTML)**:

1. Start with preview HTML (variables already interpolated)
2. Select theme\* (Professional/Modern/Minimal/Default) - is just to demo -
   customized variables for each client (like in bootstrap framework utility
   classes)
3. Get theme CSS (colors, fonts, spacing rules)
4. **Juice conversion**: Inline all CSS into `style=""` attributes
5. Wrap in email template (MSO tags for Outlook, meta tags for mobile)
6. Result: HTML that works in Gmail, Outlook, Yahoo, Apple Mail, etc.

**Email compatibility**: Uses inline CSS because email clients don't support
external stylesheets or `<style>` tags reliably.

**📱 Mobile-First**: All HTML output includes responsive meta tags (`viewport`,
`width=device-width`) and uses flexible layouts that adapt to screen width.
Themes are tested to ensure readability on 320px mobile screens.

## Key Components

### Milkdown Editor (3rd Party Library)

- Open-source markdown editor built on ProseMirror
- Lets us extend markdown with custom "nodes" (pills, alignment blocks)
- Handles all the complex editor stuff (undo/redo, selection, keyboard
  shortcuts)

### Custom Plugins (Our Code)

**Pill Plugin** (`plugins/pill/`)

- Detects `{{` trigger → shows dropdown menu of customer fields
- Renders pills as colored badges in editor
- Saves back to `{{Field_Name}}` markdown syntax
- Atomic deletion (can't delete half a pill)

**Alignment Plugin** (`plugins/alignment/`)

- Parses `[align:X]...[/align]` shortcode blocks
- Renders colored borders in editor (green=left, blue=center, orange=right,
  purple=justify)
- Preserves nested content (headings, paragraphs, pills inside alignment)
- Converts to inline CSS for HTML export

### Email Template Conversion with Juice

When exporting templates for email, we need inline CSS because email clients
(Gmail, Outlook) strip external stylesheets. The flow:

1. **Start**: Markdown with shortcodes + customer data
2. **Transform**: Convert to HTML (variables interpolated, shortcodes →
   `<div style="text-align: X;">`)
3. **Apply Theme**: Get CSS rules for selected theme (see below)
4. **Juice Magic**: `juice.inlineContent()` converts CSS rules to inline styles
   - Takes: HTML string + CSS string
   - Returns: HTML with `style=""` attributes on every element
   - Example: `<h1>Title</h1>` + `h1 { color: blue; }` →
     `<h1 style="color: blue;">Title</h1>`
5. **Wrap**: Add email boilerplate (MSO tags for Outlook compatibility,
   responsive meta tags)
6. **Result**: Email-ready HTML that renders correctly in all email clients

**Why Juice?**: Email clients are stuck in 2000s - they don't support modern CSS
like `<style>` tags or `class=""`. Everything must be inline: `style=""` on each
tag.

### Custom Theme System

Users can choose from 4 handcrafted themes that change typography, colors, and
spacing.

**How Themes Work**:

- Each theme is pure CSS (150-200 lines)
- Base CSS applies to all themes (typography reset, spacing)
- Theme-specific CSS overrides colors, fonts, decorative elements
- Juice inlines everything before sending
- Themes are completely custom-made (not from a library)

## The Markdown-First Advantage

1. **Portability**: Templates are plain text, work anywhere
2. **Version Control**: Can track changes in Git
3. **No Lock-In**: Not dependent on specific editor or database
4. **Human Readable**: You can edit templates in Notepad if needed
5. **Simplicity**: One format rules them all - no separate "editor format" vs
   "save format"

## Technical Stack

- **Angular 19**: UI framework (components, services, routing)
- **Milkdown v7**: Markdown editor with extensibility
- **ProseMirror**: Document model under the hood (like a DOM for rich text)
- **Juice**: CSS inliner for email compatibility (converts `<style>` to
  `style=""` attributes)
- **Remark/Unified**: Markdown parser and transformer
- **localStorage**: Browser storage for saved templates
- **TypeScript**: Type-safe code with strict mode

## Design Philosophy: Shortcode-First Extension

**Core Principle**: Markdown is the foundation. Every feature beyond standard
markdown syntax is implemented as a **shortcode** (text-based syntax wrapped in
brackets).

**Why Shortcodes?**

1. **Portable**: Plain text that works in any editor
2. **Version-controllable**: Git can track changes line-by-line
3. **Extensible**: New features = new shortcode patterns
4. **Predictable**: Same syntax pattern for all custom features
5. **Mobile-friendly**: All shortcodes render responsively on small screens

**Shortcode Pattern**: `[feature:option]content[/feature]`

**Current Shortcodes**:

- Variables: `{{Field_Name}}` (pill rendering in editor)
- Alignment: `[align:center]...[/align]` (left/center/right/justify)

**Future Shortcodes** (examples of how to extend):

- Buttons: `[button:https://example.com]Click Here[/button]`
- Signatures: `[signature:manager]` (pre-defined signature blocks)
- Spacers: `[spacer:20px]` (vertical spacing control)
- Images: `[image:logo-id]` (from approved image library)

**NOT Supported** (by design):

- ❌ Complex multi-column layouts
- ❌ Floating elements or absolute positioning
- ❌ Background images (unreliable in email)
- ❌ Custom fonts (use web-safe fonts only)
- ❌ JavaScript or interactive elements
- ❌ Complex Word document conversions

**Rule of Thumb**: If you can't describe it in 1 line of text syntax, it's too
complex for email templates. Keep it simple, keep it readable.

## For New Developers

If you're new to this codebase:

1. **Start here**: Read a saved markdown template from localStorage - that's
   your source of truth
2. **Understand the flow**: Markdown → Parser → ProseMirror Nodes → Visual
   Editor → Back to Markdown
3. **Explore plugins**: Look at `alignment-node.ts` to see how shortcodes become
   visual elements
4. **Study email export**: Check `template-preview.component.ts` to see the
   Juice conversion pipeline
5. **Examine themes**: See how 180 lines of CSS (per theme) create completely
   different email aesthetics
6. **Remember**: The markdown file is king. Everything else is just different
   views/transforms of the same data.
