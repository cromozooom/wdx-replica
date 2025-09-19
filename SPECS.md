## specs:

in my automation widget I would like to be able to:

1. Use an ag-grid enterprise to display jobs list in the chronological order all together with the runnings so it will be something like (I would like to be able to group them which is part of the AG-grid enterprise features):
   - job name 1
   - type (form / document)
   - details about the validation (breach list)
   - date of run
   - status (running / completed / failed)
   - link to breach list
   - how may record hav been tested
   - how may record hav been passed
   - how may record hav been failed (to review)
   - how may record hav been failed (with error)
2. use an offscreen component (create that component s a part of the ui of this app) to display another grid with the list of breaches (this list of breaches should be available outside of teh scope of this dashboard as well)

Most probably I would like the 2 component described before to be available outside of the scope of the widget so they can be simply used in the dashboard

Now if you look at this folder I would like to be able to serve the dummy data as response of the api so I can start build all the ui for the above.

# I would like to go to the next level:

## from jobs-grid.component.ts

so ag-grid should have a new celrender that will have 2 actions:

1.  action 1 - open an Offcanvas from ng-bootsrap where I could show the breachList
2.  action 2 - set a curent job and open the
<li [ngbNavItem]="2">
   <button ngbNavLink>Editor</button>
   <ng-template ngbNavContent> editor </ng-template>
 </li>
from widget-automation-content.component.html

## plan

1. Scaffold actions cell renderer for jobs grid
   - Create a new Angular cell renderer component for ag-grid that displays two action buttons: one to open an Offcanvas with the breachList, and one to set the current job and trigger the Editor tab in the parent component.
2. Implement Offcanvas for breachList display
   - Create an ng-bootstrap Offcanvas component to show the breachList for a selected job. Ensure it can be opened from the jobs grid action cell and is reusable.
3. Enable Editor tab navigation from jobs grid
   - Add logic to set the current job and programmatically switch to the Editor tab in widget-automation-content.component when the second action is triggered from the jobs grid.
4. Integrate actions cell renderer into jobs grid
   - Update jobs-grid.component.ts to use the new actions cell renderer and wire up the required event outputs for Offcanvas and Editor tab actions.
5. Test and polish UI/UX for actions
   - Verify that both actions work as expected: Offcanvas opens with correct breachList, and Editor tab is activated with the correct job context. Polish UI as needed.

src\core\modules\dashboard-widgets\automation-configurator
src\app\modules\dashboard-widgets\widget-automation-content
src\libs\ag-grid-wrapper
src\libs\ag-grid-wrapper

\src\core\modules\dashboard-widgets\automation-configurator

\src\libs\ag-grid-wrapper

\src\core\components\portal-grid-wrapper

src\core\services\lazy-loader.service.ts

\src\core\models\lazy-load-components.ts
