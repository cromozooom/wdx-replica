in this component I should have

# Sepcs

## General info

- a single signal store for state in rxjs
- few tabs described below:

## Tabs

1. User editors - where I will be able to add users with:
   - names: string
   - roles: 'admin' | 'default'
   - current: boolean
1. form creator - where I'll be able to add new forms in json format using
   https://jsonforms.io/ with the editor used by https://jsoneditoronline.org/:
   - names: string
   - formConfig: json input using a json editor
1. form editor - where i can select a form and modify data from it as the
   currentUser
   - automatic save is happening all the time when I outOfFocus a field
   - I need a button like to revert to the previous state
   - every save is making a registration in formHistory of al the values from
     the form
   - the automatic save should be registered in the history state so I can
     filter by "automatic save" or "button save"

## On the top bar:

1. a button to export what I have configured in the tab editors
1. a button to export the history of the forms
1. a ng-select to select the current user

# Tasks

Here’s a step-by-step plan with tasks, so you can check that the project
compiles after each one:

1. Project Setup & Scaffolding

- Create the main structure for the widget-form-history component (HTML, TS,
  SCSS, module).
- Ensure the component is declared and exported properly.
- Check that the project compiles.

2. State Management

- Set up a single RxJS signal store for the component’s state.
- Add initial state structure for users, forms, and form history.
- Check that the project compiles.

3. Tabs UI

- Add a tab navigation UI (e.g., Angular Material tabs or custom).
- Create empty tab content placeholders for:
  - User editors
  - Form creator
  - Form editor
- Check that the project compiles.

4. User Editors Tab

- Implement UI and logic to add/edit users (name, role, current).
- Connect to the signal store.
- Check that the project compiles.

5. Form Creator Tab

- Integrate JSONForms (or similar) and a JSON editor (e.g., jsoneditor).
- Allow adding new forms with name and JSON config.
- Connect to the signal store.
- Check that the project compiles.

6. Form Editor Tab

- Allow selecting a form and editing its data as the current user.
- Implement automatic save on out-of-focus.
- Add a revert button to restore previous state.
- Register every save (auto or manual) in form history.
- Allow filtering history by save type.
- Check that the project compiles.

7. Top Bar Features

- Add export button for tab editors’ configuration.
- Add export button for form history.
- Add ng-select for current user selection.
- Check that the project compiles.

8. Final Review

- Test all features and flows.
- Clean up code and documentation.
- Final compile check.

You can check compilation after each task to ensure stability.
