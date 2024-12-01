import { Routes } from '@angular/router'
import { EventComponent } from './event.component'
import { EventsListComponent } from './events-list/events-list.component'
import { EventRoutesEnum } from './event-routes.enum'
import { EventCreationFormComponent } from './event-form/event-creation-form/event-creation-form.component'
import { EventEditionFormComponent } from './event-form/event-edition-form/event-edition-form.component'

export const eventRoutes: Routes = [
    {
        path: '', component: EventComponent, children: [
            {
                path: '', component: EventsListComponent,
            },
            {
                path: EventRoutesEnum.CREATE, component: EventCreationFormComponent,
            },
            {
                path: EventRoutesEnum.EDIT, component: EventEditionFormComponent,
            },
        ],
    },
]
