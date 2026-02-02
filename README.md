# WDX Replica

Angular 19 application built with strict dependency management and clean code
principles.

## Project Constitution

This project follows a defined set of development principles documented in
[`.specify/memory/constitution.md`](.specify/memory/constitution.md). Key
principles include:

- **Minimal Dependencies**: Every dependency must be justified and approved
- **Clean Code Standards**: Readable, maintainable code with strict TypeScript
  typing
- **Component Architecture**: Smart/dumb pattern, standalone-first approach
- **Performance First**: Bundle size monitoring, lazy loading, and optimization

All development work must align with these constitutional principles.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Watch mode
npm run watch
```

## Tech Stack

- **Framework**: Angular 19.2+ with standalone components
- **Language**: TypeScript 5.7+ (strict mode)
- **Build Tool**: Angular CLI with webpack 5.99+
- **UI Components**: Angular Material, Bootstrap 5.3+
- **Data Grid**: ag-grid-enterprise 33.3+
- **State Management**: @ngrx/signals and @ngrx/store

## Project Structure

```
src/
├── app/           # Application components and modules
├── core/          # Core services, components, and modules
├── libs/          # Shared library code
└── assets/        # Static assets
```

## Spec-Driven Development

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
structured development. Available commands:

- `/speckit.constitution` - Update project principles
- `/speckit.specify` - Define feature requirements
- `/speckit.plan` - Create implementation plans
- `/speckit.tasks` - Generate actionable tasks
- `/speckit.implement` - Execute implementation

See [`.specify/`](.specify/) directory for specifications and templates.
