import { Routes } from '@angular/router'
import { MovementComponent } from '@pages/projects/[projectId]/movements/movement.component'
import { MovementsListComponent } from '@pages/projects/[projectId]/movements/movements-list/movements-list.component'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { MovementFormComponent } from '@pages/projects/[projectId]/movements/movement-form/movement-form.component'

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
