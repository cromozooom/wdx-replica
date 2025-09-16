# Automation Dashboard & Widget Implementation Plan

## please make a plan with task to follow in order to achieve the above

This document outlines the step-by-step plan to implement the automation dashboard and widget features, including jobs and breaches grids, using ag-grid enterprise and reusable Angular components.

## 1. Analyze automation-configurator folder

- Review the contents and structure of the `automation-configurator` folder to identify reusable components and dummy data sources.

## 2. Design jobs ag-grid component

- Plan and scaffold a standalone ag-grid enterprise component for displaying the jobs list.
- Implement grouping and all required columns:
  - Job name
  - Type (form / document)
  - Validation details (breach list)
  - Date of run
  - Status (running / completed / failed)
  - Link to breach list
  - Records tested / passed / failed (to review & with error)

## 3. Design breaches offscreen grid component

- Plan and scaffold a standalone offscreen component for displaying breaches list in a grid.
- Ensure this component is reusable outside the widget/dashboard.

## 4. Expose dummy data via API

- Serve dummy data from `automation-configurator.dummy-data.ts` as API responses for UI development and testing.

## 5. Integrate components into dashboard and widget

- Make both jobs grid and breaches grid components available for use in dashboard and widget contexts.
- Ensure they are easily reusable and maintainable.

---

Check off each step as you complete it to track progress.
