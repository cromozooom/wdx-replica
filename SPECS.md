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
