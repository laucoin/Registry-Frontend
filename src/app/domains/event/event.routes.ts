import { Routes } from '@angular/router'
import { EventComponent } from './event.component'
import { EventsListComponent } from './events-list/events-list.component'
import { EventRoutesEnum } from './event-routes.enum'
import { EventFormComponent } from './event-form/event-form.component'

export const eventRoutes: Routes = [
    {
        path: '', component: EventComponent, children: [
            {
                path: '', component: EventsListComponent,
            },
            {
                path: EventRoutesEnum.CREATE, component: EventFormComponent,
            },
            {
                path: EventRoutesEnum.EDIT, component: EventFormComponent,
            },
        ],
    },
]
