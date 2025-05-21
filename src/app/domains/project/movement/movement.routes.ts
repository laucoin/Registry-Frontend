import { Routes } from '@angular/router'
import { MovementComponent } from './movement.component'
import { MovementsListComponent } from './movements-list/movements-list.component'
import { MovementRoutesEnum } from './movement-routes.enum'
import { MovementFormComponent } from './movement-form/movement-form.component'

export const movementRoutes: Routes = [
    {
        path: '',
        component: MovementComponent,
        children: [
            {
                path: '', component: MovementsListComponent,
            },
            {
                path: MovementRoutesEnum.CREATE, component: MovementFormComponent,
            },
            {
                path: MovementRoutesEnum.EDIT, component: MovementFormComponent,
            },
        ],
    },
]
