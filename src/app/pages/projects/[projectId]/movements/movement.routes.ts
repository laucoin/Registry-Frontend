import { Routes } from '@angular/router'
import { MovementPage } from '@pages/projects/[projectId]/movements/movement.page'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { RegisteredMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page'
import { GuestMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page'

export const movementRoutes: Routes = [
    {
        path: '',
        component: MovementPage,
        children: [
            {
                path: '', component: MovementsListPage,
            },
            {
                path: MovementRoutesEnum.CREATE_REGISTERED, component: RegisteredMovementFormPage,
            },
            {
                path: MovementRoutesEnum.EDIT_REGISTERED, component: RegisteredMovementFormPage,
            },
            {
                path: MovementRoutesEnum.CREATE_GUEST, component: GuestMovementFormPage,
            },
            {
                path: MovementRoutesEnum.EDIT_GUEST, component: GuestMovementFormPage,
            },
        ],
    },
]
