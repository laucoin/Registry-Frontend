import { Routes } from '@angular/router'
import { MovementPage } from '@pages/projects/[projectId]/movements/movement.page'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { MovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/movement-form.page'

export const movementRoutes: Routes = [
    {
        path: '',
        component: MovementPage,
        children: [
            {
                path: '', component: MovementsListPage,
            },
            {
                path: MovementRoutesEnum.CREATE, component: MovementFormPage,
            },
            {
                path: MovementRoutesEnum.EDIT, component: MovementFormPage,
            },
        ],
    },
]
